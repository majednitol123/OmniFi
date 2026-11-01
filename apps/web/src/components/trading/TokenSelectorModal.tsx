'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TokenResponse } from '@omnifi/api-client';

export interface TokenSelectorModalProps {
  isOpen: boolean;
  tokens: readonly TokenResponse[];
  selectedAddress?: string | undefined;
  onSelectToken: (token: TokenResponse) => void;
  onClose: () => void;
}

export function TokenSelectorModal({
  isOpen,
  tokens,
  selectedAddress,
  onSelectToken,
  onClose,
}: TokenSelectorModalProps) {
  const [search, setSearch] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const filtered = tokens.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    );
  });

  const modalElement = (
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100vh',
        background: 'rgba(4, 6, 9, 0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 99999,
        padding: '1.5rem',
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
          margin: 'auto',
          position: 'relative',
        }}
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
            <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>Select Asset</h3>
            <p style={{ margin: '0.2rem 0 0', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              Verified tokens on the active network
            </p>
          </div>
          <button
            onClick={onClose}
            className="btn btn-secondary font-mono"
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              padding: 0,
              fontSize: '0.85rem',
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ position: 'relative', marginBottom: '1rem' }}>
          <input
            type="text"
            className="input-field font-mono"
            placeholder="Search symbol, name, or address (0x... / base58)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
            style={{ paddingLeft: '2.5rem' }}
          />
          <span
            style={{
              position: 'absolute',
              left: '0.85rem',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              fontSize: '0.9rem',
            }}
          >
            🔍
          </span>
        </div>

        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.5rem',
            maxHeight: '360px',
            paddingRight: '0.25rem',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '3rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.88rem',
              }}
            >
              No matching assets registered for this network.
            </div>
          ) : (
            filtered.map((t) => {
              const isSelected = selectedAddress?.toLowerCase() === t.address.toLowerCase();
              const isLowRisk = t.riskTier.toUpperCase() === 'LOW';

              return (
                <div
                  key={t.address}
                  onClick={() => {
                    onSelectToken(t);
                    onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 229, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected
                      ? '1px solid rgba(0, 229, 153, 0.35)'
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyber)';
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isSelected
                      ? 'rgba(0, 229, 153, 0.35)'
                      : 'var(--border-subtle)';
                    e.currentTarget.style.background = isSelected
                      ? 'rgba(0, 229, 153, 0.08)'
                      : 'rgba(255, 255, 255, 0.02)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                    <div
                      style={{
                        width: '36px',
                        height: '36px',
                        borderRadius: '50%',
                        background: 'var(--surface-overlay)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 800,
                        fontSize: '0.9rem',
                        color: 'var(--accent-cyber)',
                        border: '1px solid var(--border-default)',
                        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)',
                      }}
                    >
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '1rem', color: '#fff' }}>
                        {t.symbol}
                      </div>
                      <div
                        style={{
                          fontSize: '0.78rem',
                          color: 'var(--text-muted)',
                          maxWidth: '200px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {t.name}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <span
                      className={`badge ${isLowRisk ? 'badge-confirmed' : 'badge-medium'}`}
                      style={{ fontSize: '0.68rem', padding: '0.2rem 0.5rem' }}
                    >
                      {t.riskTier}
                    </span>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.3rem',
                      }}
                    >
                      {t.address.slice(0, 6)}...{t.address.slice(-4)}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );

  return typeof document !== 'undefined' ? createPortal(modalElement, document.body) : null;
}
