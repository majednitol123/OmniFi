'use client';

import React from 'react';
import { useWallet } from '../../context/WalletContext';

export interface NetworkOption {
  id: string;
  name: string;
  type: 'evm' | 'solana';
  chainId?: number | undefined;
}

export const NETWORKS: NetworkOption[] = [
  { id: 'eip155:1', name: 'Ethereum Mainnet', type: 'evm', chainId: 1 },
  { id: 'eip155:8453', name: 'Base Mainnet', type: 'evm', chainId: 8453 },
  { id: 'solana:mainnet-beta', name: 'Solana Mainnet', type: 'solana' },
  { id: 'solana:devnet', name: 'Solana Devnet', type: 'solana' },
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <select
        value={selectedNetworkId}
        onChange={handleSelect}
        className="font-mono"
        style={{
          background: 'var(--bg-tertiary)',
          color: 'var(--text-primary)',
          border: `1px solid ${isNetworkMismatch ? 'var(--danger-crimson)' : 'var(--border-subtle)'}`,
          borderRadius: '6px',
          padding: '0.45rem 0.75rem',
          fontSize: '0.85rem',
          cursor: 'pointer',
        }}
        aria-label="Select Network"
      >
        {NETWORKS.map((n) => (
          <option key={n.id} value={n.id}>
            {n.name}
          </option>
        ))}
      </select>

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

