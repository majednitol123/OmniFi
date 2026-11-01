'use client';

import React from 'react';
import { useWallet } from '../../context/WalletContext';

export function WalletModal() {
  const {
    address,
    walletType,
    isConnecting,
    error,
    isWalletModalOpen,
    setIsWalletModalOpen,
    openWalletModal,
    connectEvm,
    connectSolana,
    disconnect,
  } = useWallet();

  const shorten = (addr: string) => `${addr.slice(0, 6)}...${addr.slice(-4)}`;

  if (address) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        <div
          className="badge badge-low font-mono"
          style={{
            fontSize: '0.85rem',
            padding: '0.45rem 0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            borderRadius: '8px',
          }}
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
        </div>
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
    );
  }

  return (
    <>
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

      {isWalletModalOpen && (
        <div className="modal-overlay" onClick={() => setIsWalletModalOpen(false)}>
          <div
            className="modal-content"
            style={{ padding: '1.75rem' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 800 }}>Connect Wallet</h3>
                <p style={{ margin: '0.2rem 0 0', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Non-custodial cryptographic key management
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
            </div>

            <div
              style={{
                marginTop: '1.5rem',
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
        </div>
      )}
    </>
  );
}
