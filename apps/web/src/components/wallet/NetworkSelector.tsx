'use client';

import React from 'react';
import { useWallet } from '../../context/WalletContext';

export interface NetworkOption {
  id: string;
  name: string;
  shortName: string;
  type: 'evm' | 'solana';
  chainId?: number | undefined;
}

export const NETWORKS: NetworkOption[] = [
  { id: 'eip155:1', name: 'Ethereum Mainnet', shortName: 'Ethereum', type: 'evm', chainId: 1 },
  { id: 'eip155:8453', name: 'Base Mainnet', shortName: 'Base', type: 'evm', chainId: 8453 },
  { id: 'solana:mainnet-beta', name: 'Solana Mainnet', shortName: 'Solana', type: 'solana' },
  { id: 'solana:devnet', name: 'Solana Devnet', shortName: 'Sol Devnet', type: 'solana' },
];

export function NetworkSelector() {
  const { selectedNetworkId, setSelectedNetworkId, isNetworkMismatch, switchEvmChain, walletType } =
    useWallet();

  const handleSelect = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newNetworkId = e.target.value;
    setSelectedNetworkId(newNetworkId);

    const found = NETWORKS.find((n) => n.id === newNetworkId);
    if (found && found.type === 'evm' && found.chainId && walletType === 'evm') {
      await switchEvmChain(found.chainId);
    }
  };

  const currentNetwork = NETWORKS.find((n) => n.id === selectedNetworkId) || NETWORKS[0];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          background: 'rgba(255, 255, 255, 0.04)',
          border: `1px solid ${isNetworkMismatch ? 'var(--danger-crimson)' : 'var(--border-default)'}`,
          borderRadius: '8px',
          padding: '0.35rem 0.65rem',
          transition: 'border-color 0.15s ease',
        }}
      >
        <span
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: isNetworkMismatch ? 'var(--danger-crimson)' : 'var(--accent-cyber)',
            boxShadow: `0 0 8px ${isNetworkMismatch ? 'var(--danger-crimson)' : 'var(--accent-cyber)'}`,
            marginRight: '0.5rem',
            flexShrink: 0,
          }}
        />
        <select
          value={selectedNetworkId}
          onChange={handleSelect}
          className="font-mono"
          style={{
            background: 'transparent',
            color: 'var(--text-primary)',
            border: 'none',
            fontSize: '0.85rem',
            cursor: 'pointer',
            paddingRight: '1rem',
            fontWeight: 600,
            outline: 'none',
          }}
          aria-label="Select Network"
        >
          {NETWORKS.map((n) => (
            <option key={n.id} value={n.id} style={{ background: '#10141d', color: '#fff' }}>
              {n.name}
            </option>
          ))}
        </select>
      </div>

      {isNetworkMismatch && (
        <span
          className="badge badge-high"
          title="Wallet connected to a different network than selected"
        >
          Mismatch
        </span>
      )}
    </div>
  );
}
