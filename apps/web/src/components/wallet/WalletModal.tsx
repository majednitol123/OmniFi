'use client';

import React, { useState } from 'react';
import { useWallet } from '../../context/WalletContext';

export function WalletModal() {
  const { address, walletType, isConnecting, error, connectEvm, connectSolana, disconnect } =
    useWallet();
  const [isOpen, setIsOpen] = useState(false);

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <span
          className="badge badge-low font-mono"
          style={{ fontSize: '0.85rem', padding: '0.4rem 0.6rem' }}
        >
          {shorten(address)} ({walletType.toUpperCase()})
        </span>
        <button
          onClick={disconnect}
          className="btn-secondary"
          style={{ padding: '0.4rem 0.75rem', fontSize: '0.8rem' }}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn-cyber font-mono"
        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
      >
        Connect Wallet
      </button>

      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            backdropFilter: 'blur(4px)',
          }}
          onClick={() => setIsOpen(false)}
        >
          <div
            className="terminal-card"
            style={{ width: '380px', maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="terminal-card-header">
              <span style={{ fontWeight: 600 }}>Connect Wallet</span>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                }}
              >
                ✕
              </button>
            </div>

            {error && (
              <div
                className="badge badge-high"
                style={{ width: '100%', marginBottom: '1rem', padding: '0.5rem' }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <button
                className="btn-secondary font-mono"
                onClick={async () => {
                  await connectEvm();
                  setIsOpen(false);
                }}
                disabled={isConnecting}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>EVM Wallet (MetaMask / Injected)</span>
                <span className="badge badge-low">EIP-1193</span>
              </button>

              <button
                className="btn-secondary font-mono"
                onClick={async () => {
                  await connectSolana();
                  setIsOpen(false);
                }}
                disabled={isConnecting}
                style={{
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>Solana Wallet (Phantom / Solflare)</span>
                <span className="badge badge-medium">SPL</span>
              </button>
            </div>

            <div
              style={{
                marginTop: '1.25rem',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.4,
              }}
            >
              OmniFi is strictly non-custodial. Off-chain services and frontend never access or
              custody your private keys.
            </div>
          </div>
        </div>
      )}
    </>
  );
}
