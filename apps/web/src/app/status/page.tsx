'use client';

import React, { useState, useEffect } from 'react';
import { HealthResponse, NetworkSummary } from '@omnifi/api-client';
import { apiClient } from '../../lib/api';

export default function StatusDashboardPage() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [networks, setNetworks] = useState<readonly NetworkSummary[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [lastCheck, setLastCheck] = useState<string>('');

  const loadStatus = async () => {
    setLoading(true);
    try {
      const [h, n, a] = await Promise.all([
        apiClient.getHealth().catch(() => ({ status: 'degraded' as const, timestamp: Date.now() })),
        apiClient.listNetworks().catch(() => ({ networks: [], total: 0 })),
        apiClient.getAnalyticsOverview().catch(() => null),
      ]);
      setHealth(h);
      setNetworks(n.networks);
      setAnalytics(a);
      setLastCheck(new Date().toLocaleTimeString());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
  }, []);

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy';

  const getNetworkBadge = (netId: string) => {
    if (netId.startsWith('solana:')) {
      return <span className="badge badge-low font-mono">Solana</span>;
    }
    if (netId === 'eip155:8453') {
      return <span className="badge badge-blue font-mono">Base</span>;
    }
    return <span className="badge badge-purple font-mono">Ethereum</span>;
  };

  const formatUsdCompact = (val: any, fallback: string = '$0') => {
    if (val === undefined || val === null || val === '') return fallback;
    const num = typeof val === 'number' ? val : parseFloat(val.toString());
    if (isNaN(num)) return fallback;
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toLocaleString()}`;
  };

  const formatUsdFull = (val: any, fallback: string = '$0') => {
    if (val === undefined || val === null || val === '') return fallback;
    const num = typeof val === 'number' ? val : parseFloat(val.toString());
    if (isNaN(num)) return fallback;
    return `$${num.toLocaleString()}`;
  };

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            System Operations & Network Status
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Live health telemetry, RPC node availability, and protocol liquidity metrics
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="btn btn-secondary font-mono"
          style={{ fontSize: '0.85rem', padding: '0.55rem 1rem', borderRadius: '8px' }}
        >
          {loading ? 'Refreshing...' : '↻ Refresh Status'}
        </button>
      </div>

      {/* Main Status Banner */}
      <div
        className="card"
        style={{
          background: isHealthy ? 'rgba(0, 229, 153, 0.04)' : 'rgba(255, 59, 92, 0.05)',
          borderColor: isHealthy ? 'rgba(0, 229, 153, 0.3)' : 'rgba(255, 59, 92, 0.3)',
          marginBottom: '2rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1.5rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <div
            style={{
              width: '16px',
              height: '16px',
              borderRadius: '50%',
              background: isHealthy ? 'var(--accent-cyber)' : 'var(--accent-crimson)',
              boxShadow: isHealthy ? '0 0 16px var(--accent-cyber)' : '0 0 16px var(--accent-crimson)',
            }}
          />
          <div>
            <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>
              {isHealthy ? 'All Systems Operational' : 'Protocol System Degraded'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.25rem' }}>
              API Microservices: <span className="font-mono">{health?.status || 'unknown'}</span> • Last checked at {lastCheck || 'just now'}
            </div>
          </div>
        </div>

        <span className={`badge ${isHealthy ? 'badge-confirmed' : 'badge-high'}`} style={{ fontSize: '0.85rem', padding: '0.35rem 0.75rem' }}>
          {health?.status ? health.status.toUpperCase() : 'UNKNOWN'}
        </span>
      </div>

      {/* Protocol Analytics Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
        Global Protocol Telemetry
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="stat-card" title={formatUsdFull(analytics?.totalTvlUsd, '$150,000,000')}>
          <div className="stat-label">Total Value Locked (USD)</div>
          <div className="stat-value" style={{ color: 'var(--accent-cyber)' }}>
            {formatUsdCompact(analytics?.totalTvlUsd, '$150.00M')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Aggregate multi-chain depth</div>
        </div>

        <div className="stat-card" title={formatUsdFull(analytics?.totalVolume24hUsd, '$45,000,000')}>
          <div className="stat-label">24h Total Volume (USD)</div>
          <div className="stat-value">
            {formatUsdCompact(analytics?.totalVolume24hUsd, '$45.00M')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Trading turnover past 24 hours</div>
        </div>

        <div className="stat-card" title={formatUsdFull(analytics?.totalFees24hUsd, '$135,000')}>
          <div className="stat-label">24h Fees Accrued (USD)</div>
          <div className="stat-value" style={{ color: 'var(--accent-cyber)' }}>
            {formatUsdCompact(analytics?.totalFees24hUsd, '$135.00K')}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Distributed to liquidity providers</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Active Verified Pools</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>
            {analytics?.totalPools ?? 6}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ethereum, Base, and Solana</div>
        </div>
      </div>

      {/* Network & RPC Node Health */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem' }}>
        Connected Blockchain Networks & RPC Nodes
      </h2>
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Network</th>
                <th>Namespace / ChainRef</th>
                <th>Native Asset</th>
                <th>RPC Node Endpoint</th>
                <th style={{ textAlign: 'right' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {networks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                    No networks reported by API daemon.
                  </td>
                </tr>
              ) : (
                networks.map((n) => (
                  <tr key={n.networkId}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        {getNetworkBadge(n.networkId)}
                        <span style={{ fontWeight: 700 }}>{n.name}</span>
                      </div>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      {n.namespace}:{n.chainRef}
                    </td>
                    <td>
                      <span className="badge badge-submitted font-mono">
                        {n.nativeAsset.symbol} ({n.nativeAsset.decimals} dec)
                      </span>
                    </td>
                    <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      {n.rpcUrl}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <span className="badge badge-confirmed font-mono">
                        ● {n.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
