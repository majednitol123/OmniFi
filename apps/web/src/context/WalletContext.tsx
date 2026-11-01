'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

export type WalletType = 'none' | 'evm' | 'solana';

export interface WalletContextState {
  walletType: WalletType;
  address: string | null;
  chainId: number | null; // for EVM
  cluster: 'mainnet-beta' | 'devnet' | 'localnet' | null; // for Solana
  selectedNetworkId: string;
  isNetworkMismatch: boolean;
  isConnecting: boolean;
  error: string | null;
  connectEvm: () => Promise<void>;
  connectSolana: () => Promise<void>;
  disconnect: () => void;
  setSelectedNetworkId: (networkId: string) => void;
  switchEvmChain: (targetChainId: number) => Promise<void>;
}

const WalletContext = createContext<WalletContextState | undefined>(undefined);

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [walletType, setWalletType] = useState<WalletType>('none');
  const [address, setAddress] = useState<string | null>(null);
  const [chainId, setChainId] = useState<number | null>(null);
  const [cluster, setCluster] = useState<'mainnet-beta' | 'devnet' | 'localnet' | null>(null);
  const [selectedNetworkId, setSelectedNetworkId] = useState<string>('eip155:1');
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Check network mismatch
  let isNetworkMismatch = false;
  if (address && walletType === 'evm') {
    if (selectedNetworkId.startsWith('solana:')) {
      isNetworkMismatch = true;
    } else {
      const selectedChainId = parseInt(selectedNetworkId.split(':')[1] ?? '1', 10);
      if (chainId !== null && chainId !== selectedChainId) {
        isNetworkMismatch = true;
      }
    }
  } else if (address && walletType === 'solana') {
    if (selectedNetworkId.startsWith('eip155:')) {
      isNetworkMismatch = true;
    }
  }

  // Connect EVM
  const connectEvm = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error('No EVM wallet detected (MetaMask, Coinbase, etc.).');
      }
      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const currentChain = await ethereum.request({ method: 'eth_chainId' });

      setAddress(accounts[0] || null);
      setChainId(parseInt(currentChain, 16));
      setWalletType('evm');
    } catch (err: any) {
      setError(err?.message || 'Failed to connect EVM wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  // Connect Solana
  const connectSolana = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      if (typeof window === 'undefined' || !(window as any).solana) {
        throw new Error('No Solana wallet detected (Phantom, Solflare, etc.).');
      }
      const solana = (window as any).solana;
      const resp = await solana.connect();
      setAddress(resp.publicKey.toBase58());
      setCluster('mainnet-beta');
      setWalletType('solana');
    } catch (err: any) {
      setError(err?.message || 'Failed to connect Solana wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = () => {
    setAddress(null);
    setChainId(null);
    setCluster(null);
    setWalletType('none');
    setError(null);
  };

  const switchEvmChain = async (targetChainId: number) => {
    if (typeof window === 'undefined' || !(window as any).ethereum) return;
    try {
      const hexChainId = `0x${targetChainId.toString(16)}`;
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }],
      });
      setChainId(targetChainId);
    } catch (err: any) {
      setError(err?.message || `Failed to switch to chain ${targetChainId}`);
    }
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;
      const handleAccountsChanged = (accounts: string[]) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          setAddress(accounts[0] ?? null);
        }
      };
      const handleChainChanged = (hexChain: string) => {
        setChainId(parseInt(hexChain, 16));
      };

      if (ethereum.on) {
        ethereum.on('accountsChanged', handleAccountsChanged);
        ethereum.on('chainChanged', handleChainChanged);
      }

      return () => {
        if (ethereum.removeListener) {
          ethereum.removeListener('accountsChanged', handleAccountsChanged);
          ethereum.removeListener('chainChanged', handleChainChanged);
        }
      };
    }
  }, []);

  return (
    <WalletContext.Provider
      value={{
        walletType,
        address,
        chainId,
        cluster,
        selectedNetworkId,
        isNetworkMismatch,
        isConnecting,
        error,
        connectEvm,
        connectSolana,
        disconnect,
        setSelectedNetworkId,
        switchEvmChain,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet(): WalletContextState {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}

