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

  const getNetworkBadge = (netId: string) => {
    if (netId.startsWith('solana:')) {
      return <span className="badge badge-low font-mono">Solana</span>;
    }
    if (netId === 'eip155:8453') {
      return <span className="badge badge-blue font-mono">Base</span>;
    }
    return <span className="badge badge-purple font-mono">Ethereum</span>;
  };

  const getRiskBadge = (tier: string) => {
    const t = tier.toUpperCase();
    if (t === 'LOW') {
      return <span className="badge badge-confirmed font-mono">LOW RISK</span>;
    }
    if (t === 'MEDIUM') {
      return <span className="badge badge-amber font-mono">MEDIUM</span>;
    }
    return <span className="badge badge-high font-mono">HIGH RISK</span>;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
          Token Asset Registry
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
          Verified multi-chain token contracts, asset specifications, and on-chain security risk classifications
        </p>
      </div>

      {/* Security Advisory Banner */}
      <div
        className="card"
        style={{
          background: 'rgba(0, 229, 153, 0.03)',
          borderColor: 'rgba(0, 229, 153, 0.25)',
          marginBottom: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1.25rem',
          padding: '1.2rem 1.5rem',
        }}
      >
        <div
          style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: 'rgba(0, 229, 153, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.25rem',
            color: 'var(--accent-cyber)',
            flexShrink: 0,
          }}
        >
          🛡
        </div>
        <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: '#fff' }}>Verified Asset Verification:</strong> All tokens in this registry
          undergo automated bytecode verification, fee-on-transfer anomaly detection, and liquidity threshold validation.
          Tokens marked <span className="badge badge-confirmed" style={{ fontSize: '0.7rem' }}>LOW</span> are
          standardized ERC-20 / SPL tokens with active protocol liquidity.
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
          padding: '1.15rem 1.25rem',
        }}
      >
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', flex: 1, alignItems: 'center' }}>
          <div style={{ position: 'relative', minWidth: '320px', flex: 1 }}>
            <input
              type="text"
              className="input-field font-mono"
              placeholder="Search symbol, name, contract address..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ paddingLeft: '2.4rem' }}
            />
            <span
              style={{
                position: 'absolute',
                left: '0.85rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-muted)',
                fontSize: '0.85rem',
              }}
            >
              🔍
            </span>
          </div>

          <select
            className="input-field font-mono"
            value={networkFilter}
            onChange={(e) => setNetworkFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '170px' }}
          >
            <option value="all">All Networks</option>
            <option value="eip155:1">Ethereum Mainnet</option>
            <option value="eip155:8453">Base</option>
            <option value="solana:mainnet-beta">Solana</option>
          </select>

          <select
            className="input-field font-mono"
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            style={{ width: 'auto', minWidth: '160px' }}
          >
            <option value="all">All Risk Tiers</option>
            <option value="LOW">LOW Risk</option>
            <option value="MEDIUM">MEDIUM Risk</option>
            <option value="HIGH">HIGH Risk</option>
          </select>
        </div>

        <div className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--accent-cyber)', fontWeight: 700 }}>{filtered.length}</span> verified assets
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
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    Loading token metadata registry...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No tokens match the selected filters.
                  </td>
                </tr>
              ) : (
                filtered.map((t) => {
                  return (
                    <tr key={`${t.networkId}-${t.address}`}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                          <div
                            style={{
                              width: '34px',
                              height: '34px',
                              borderRadius: '50%',
                              background: 'var(--surface-overlay)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              fontSize: '0.85rem',
                              color: 'var(--accent-cyber)',
                              border: '1px solid var(--border-default)',
                            }}
                          >
                            {t.symbol.slice(0, 2)}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{t.symbol}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{t.name}</div>
                          </div>
                        </div>
                      </td>
                      <td>{getNetworkBadge(t.networkId)}</td>
                      <td className="font-mono" style={{ fontSize: '0.82rem' }}>
                        {t.address.slice(0, 8)}...{t.address.slice(-6)}
                      </td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>{t.decimals}</td>
                      <td>{getRiskBadge(t.riskTier)}</td>
                      <td style={{ textAlign: 'right' }}>
                        <Link
                          href={`/?tokenIn=${encodeURIComponent(t.address)}`}
                          className="btn btn-primary font-mono"
                          style={{ padding: '0.4rem 0.85rem', fontSize: '0.78rem', borderRadius: '6px' }}
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
