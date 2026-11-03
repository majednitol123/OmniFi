'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useWallet } from '../../context/WalletContext';

export function WalletModal() {
  const {
    address,
    walletType,
    isConnecting,
    error,
    selectedNetworkId,
    isWalletModalOpen,
    setIsWalletModalOpen,
    openWalletModal,
    connectEvm,
    connectSolana,
    disconnect,
  } = useWallet();

  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isWalletModalOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsWalletModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isWalletModalOpen, setIsWalletModalOpen]);

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  const handleCopyAddress = () => {
    if (!address) return;
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getExplorerUrl = () => {
    if (!address) return '#';
    if (selectedNetworkId.startsWith('solana:')) {
      return `https://solscan.io/account/${address}`;
    }
    if (selectedNetworkId === 'eip155:8453') {
      return `https://basescan.org/address/${address}`;
    }
    return `https://etherscan.io/address/${address}`;
  };

  // Modal dialog content
  const modalContent = isWalletModalOpen && mounted ? (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Connect Wallet Dialog"
      onClick={() => setIsWalletModalOpen(false)}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(4, 6, 9, 0.85)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        zIndex: 99999,
        padding: '2.5rem 1rem 2rem',
        overflowY: 'auto',
        boxSizing: 'border-box',
      }}
    >
      <div
        className="modal-content"
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-modal)',
          padding: '1.5rem',
          width: '100%',
          maxWidth: '460px',
          maxHeight: 'min(88vh, 580px)',
          overflowY: 'auto',
          marginTop: 'auto',
          marginBottom: 'auto',
          marginLeft: 'auto',
          marginRight: 'auto',
          position: 'relative',
          boxSizing: 'border-box',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>
              {address ? 'Connected Wallet' : 'Connect Wallet'}
            </h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {address
                ? 'Active non-custodial cryptographic account'
                : 'Select provider for client-side signing'}
            </p>
          </div>
          <button
            onClick={() => setIsWalletModalOpen(false)}
            className="btn btn-secondary font-mono"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              padding: 0,
              fontSize: '0.9rem',
            }}
          >
            ✕
          </button>
        </div>

        {error && (
          <div
            className="badge badge-high"
            style={{
              width: '100%',
              marginBottom: '1.25rem',
              padding: '0.75rem',
              borderRadius: '8px',
              lineHeight: 1.4,
            }}
          >
            ⚠ {error}
          </div>
        )}

        {/* CONNECTED WALLET VIEW */}
        {address ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Status card */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid var(--border-default)',
                borderRadius: '12px',
                padding: '1.1rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '0.75rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--accent-cyber)',
                      boxShadow: '0 0 8px var(--accent-cyber)',
                    }}
                  />
                  <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-cyber)' }}>
                    CONNECTED & ACTIVE
                  </span>
                </div>
                <span className="badge badge-low font-mono" style={{ fontSize: '0.72rem' }}>
                  {walletType.toUpperCase()}
                </span>
              </div>

              {/* Full Address */}
              <div
                className="font-mono"
                style={{
                  fontSize: '0.9rem',
                  fontWeight: 700,
                  wordBreak: 'break-all',
                  background: 'rgba(0, 0, 0, 0.4)',
                  padding: '0.75rem 0.85rem',
                  borderRadius: '8px',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '0.75rem',
                  color: '#fff',
                }}
              >
                {address}
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '0.6rem' }}>
                <button
                  onClick={handleCopyAddress}
                  className="btn btn-secondary font-mono"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem' }}
                >
                  {copied ? '✓ Copied Address' : '📋 Copy Address'}
                </button>
                <a
                  href={getExplorerUrl()}
                  target="_blank"
                  rel="noreferrer"
                  className="btn btn-secondary font-mono"
                  style={{ flex: 1, padding: '0.45rem', fontSize: '0.8rem', textDecoration: 'none' }}
                >
                  View on Explorer ↗
                </a>
              </div>
            </div>

            {/* Network card */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.85rem 1rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.82rem',
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Selected Network</span>
              <span className="badge badge-blue font-mono">{selectedNetworkId}</span>
            </div>

            {/* Switch Provider / Disconnect Actions */}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn btn-secondary font-mono"
                onClick={async () => {
                  if (walletType === 'evm') {
                    await connectSolana();
                  } else {
                    await connectEvm();
                  }
                  setIsWalletModalOpen(false);
                }}
                style={{ flex: 1, padding: '0.75rem', fontSize: '0.85rem' }}
              >
                Switch to {walletType === 'evm' ? 'Solana' : 'EVM'}
              </button>

              <button
                className="btn font-mono"
                onClick={() => {
                  disconnect();
                  setIsWalletModalOpen(false);
                }}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  fontSize: '0.85rem',
                  background: 'rgba(255, 51, 102, 0.1)',
                  color: 'var(--accent-crimson)',
                  border: '1px solid rgba(255, 51, 102, 0.3)',
                }}
              >
                Disconnect
              </button>
            </div>
          </div>
        ) : (
          /* DISCONNECTED: CHOOSE PROVIDER VIEW */
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <button
              className="btn btn-secondary"
              onClick={async () => {
                await connectEvm();
                setIsWalletModalOpen(false);
              }}
              disabled={isConnecting}
              style={{
                padding: '1rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(0, 229, 153, 0.1)',
                    border: '1px solid rgba(0, 229, 153, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--accent-cyber)',
                  }}
                >
                  Ξ
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>EVM Wallet</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    MetaMask, Coinbase, Injected (EIP-1193)
                  </div>
                </div>
              </div>
              <span className="badge badge-low">Ethereum / Base</span>
            </button>

            <button
              className="btn btn-secondary"
              onClick={async () => {
                await connectSolana();
                setIsWalletModalOpen(false);
              }}
              disabled={isConnecting}
              style={{
                padding: '1rem 1.15rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderRadius: '12px',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: 'rgba(56, 189, 248, 0.1)',
                    border: '1px solid rgba(56, 189, 248, 0.25)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    color: 'var(--accent-blue)',
                  }}
                >
                  ◎
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>Solana Wallet</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Phantom, Solflare, Standard Wallet
                  </div>
                </div>
              </div>
              <span className="badge badge-blue">Solana SPL</span>
            </button>

            <div
              style={{
                marginTop: '1.25rem',
                padding: '0.85rem',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.02)',
                border: '1px solid var(--border-subtle)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                lineHeight: 1.45,
              }}
            >
              🔒 <strong>Non-Custodial Architecture:</strong> OmniFi transactions are signed client-side via your local wallet provider. Your private keys never touch off-chain services or servers.
            </div>
          </div>
        )}
      </div>
    </div>
  ) : null;

  // Header trigger buttons
  return (
    <>
      {address ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <button
            onClick={openWalletModal}
            className="badge badge-low font-mono"
            style={{
              fontSize: '0.85rem',
              padding: '0.45rem 0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              borderRadius: '8px',
              cursor: 'pointer',
              border: '1px solid rgba(0, 229, 153, 0.3)',
              background: 'rgba(0, 229, 153, 0.08)',
              transition: 'all 0.15s ease',
            }}
            title="Click to view wallet details"
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                background: 'var(--accent-cyber)',
                boxShadow: '0 0 8px var(--accent-cyber)',
              }}
            />
            <span>{shorten(address)}</span>
            <span style={{ opacity: 0.65 }}>({walletType.toUpperCase()})</span>
          </button>
          <button
            onClick={disconnect}
            className="btn btn-secondary font-mono"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.8rem',
              borderRadius: '8px',
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <button
          onClick={openWalletModal}
          className="btn btn-primary font-mono"
          style={{
            padding: '0.55rem 1.15rem',
            fontSize: '0.88rem',
            borderRadius: '8px',
          }}
        >
          <span
            style={{
              width: '7px',
              height: '7px',
              borderRadius: '50%',
              background: '#000',
            }}
          />
          <span>Connect Wallet</span>
        </button>
      )}

      {/* RENDER MODAL VIA PORTAL TO BODY (CENTRALIZED, ESCAPING HEADER CONTAINER) */}
      {mounted && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
    </>
  );
}
