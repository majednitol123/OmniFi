'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TokenResponse } from '@omnifi/api-client';
import { useWallet } from '../../context/WalletContext';
import { apiClient } from '../../lib/api';

export default function TokensDirectoryPage() {
  const { selectedNetworkId } = useWallet();

  const [tokens, setTokens] = useState<readonly TokenResponse[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [networkFilter, setNetworkFilter] = useState<string>('all');

  useEffect(() => {
    let cancelled = false;
    async function loadTokens() {
      setLoading(true);
      try {
        const net = networkFilter === 'all' ? undefined : networkFilter;
        const tier = riskFilter === 'all' ? undefined : riskFilter;
        const resp = await apiClient.listTokens(net, tier);
        if (!cancelled) {
          setTokens(resp.tokens);
        }
      } catch (err) {
        console.error('Failed to load tokens directory:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadTokens();
    return () => {
      cancelled = true;
    };
  }, [networkFilter, riskFilter]);

  const filtered = tokens.filter((t) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.symbol.toLowerCase().includes(q) ||
      t.name.toLowerCase().includes(q) ||
      t.address.toLowerCase().includes(q)
    );
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
          Token Asset Registry
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
          Verified token metadata, contract specifications, and risk classifications
        </p>
      </div>

      {/* Security Advisory Banner */}
      <div
        className="card"
        style={{
          background: 'rgba(0, 229, 153, 0.03)',
          borderColor: 'rgba(0, 229, 153, 0.2)',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <span style={{ fontSize: '1.5rem' }}>🛡</span>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
          <strong style={{ color: 'var(--accent-cyber)' }}>Token Risk Framework:</strong> Assets rated{' '}
          <span className="badge badge-confirmed" style={{ fontSize: '0.7rem' }}>LOW</span> have verified code,
          deep liquidity pools, and standardized transfer semantics. Higher risk tiers require extra scrutiny before trading.
        </div>
      </div>

      {/* Filter Bar */}
      <div
        className="card"
        style={{
          marginBottom: '1.5rem',
          display: 'flex',
          gap: '1rem',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1 }}>
          <input
            type="text"
            className="input-field font-mono"
            placeholder="Search by name, symbol, or address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '340px' }}
          />

          <select
            className="input-field font-mono"
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Networks</option>
            <option value="eip155:1">Ethereum Mainnet</option>
            <option value="eip155:8453">Base</option>
            <option value="solana:mainnet-beta">Solana Mainnet-Beta</option>
          </select>

          <select
            className="input-field font-mono"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Risk Tiers</option>
            <option value="LOW">LOW Risk Tier</option>
            <option value="MEDIUM">MEDIUM Risk Tier</option>
            <option value="HIGH">HIGH Risk Tier</option>
          </select>
        </div>

        <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          {filtered.length} verified assets
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Network</th>
                <th>Contract Address</th>
                <th>Decimals</th>
                <th>Risk Tier</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading token metadata registry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No tokens match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  const isLow = t.riskTier.toUpperCase() === 'LOW';
                  return (
                    <tr key={`${t.networkId}-${t.address}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '28px',
                              height: '28px',
                              borderRadius: '50%',
                              background: 'var(--surface-overlay)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 700,
                              fontSize: '0.75rem',
                              color: 'var(--accent-cyber)',
                              border: '1px solid var(--border-subtle)',
                            }}
                          >
                            {t.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700 }}>{t.symbol}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{t.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className="badge badge-submitted font-mono" style={{ fontSize: '0.75rem' }}>
                          {t.networkId}
                        </span>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                        {t.address.slice(0, 10)}...{t.address.slice(-6)}
                      </td>
                      <td className="font-mono">{t.decimals}</td>
                      <td>
                        <span
                          className={`badge ${isLow ? 'badge-confirmed' : 'badge-amber'}`}
                          style={{ fontSize: '0.75rem' }}
                        >
                          {t.riskTier}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/?tokenIn=${encodeURIComponent(t.address)}`}
                          className="btn btn-primary font-mono"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
                        >
                          Trade Asset
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

