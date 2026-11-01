'use client';

import React, { useState } from 'react';
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

  if (!isOpen) return null;

  const filtered = tokens.filter((t) => {
    const q = search.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    );
  });

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
        padding: '1rem',
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: '440px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: 'var(--shadow-elevation)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Select Asset</h3>
          <button
            onClick={onClose}
            className="btn btn-secondary font-mono"
            style={{ padding: '0.2rem 0.5rem', fontSize: '0.85rem' }}
          >
            ✕
          </button>
        </div>

        <input
          type="text"
          className="input-field font-mono"
          placeholder="Search name, symbol, or address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          autoFocus
          style={{ marginBottom: '1rem' }}
        />

        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '0.4rem',
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: '2rem 1rem',
                textAlign: 'center',
                color: 'var(--text-muted)',
                fontSize: '0.9rem',
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
                    padding: '0.75rem',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(0, 229, 153, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                    border: isSelected
                      ? '1px solid rgba(0, 229, 153, 0.3)'
                      : '1px solid var(--border-subtle)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = 'var(--accent-cyber)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = isSelected
                      ? 'rgba(0, 229, 153, 0.3)'
                      : 'var(--border-subtle)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        background: 'var(--surface-overlay)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        color: 'var(--accent-cyber)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      {t.symbol.slice(0, 2)}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.symbol}</div>
                      <div
                        style={{
                          fontSize: '0.75rem',
                          color: 'var(--text-muted)',
                          maxWidth: '180px',
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
                      className={`badge ${isLowRisk ? 'badge-confirmed' : 'badge-amber'}`}
                      style={{ fontSize: '0.7rem' }}
                    >
                      {t.riskTier}
                    </span>
                    <div
                      className="font-mono"
                      style={{
                        fontSize: '0.7rem',
                        color: 'var(--text-muted)',
                        marginTop: '0.2rem',
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
}

