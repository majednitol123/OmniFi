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
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
            System Operations & Network Status
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Live health telemetry, RPC node availability, and protocol liquidity metrics
          </p>
        </div>

        <button
          onClick={loadStatus}
          disabled={loading}
          className="btn btn-secondary font-mono"
          style={{ fontSize: '0.85rem' }}
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
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              background: isHealthy ? 'var(--accent-cyber)' : 'var(--accent-crimson)',
              boxShadow: isHealthy ? '0 0 12px var(--accent-cyber)' : '0 0 12px var(--accent-crimson)',
            }}
          />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>
              {isHealthy ? 'All Systems Operational' : 'Protocol System Degraded'}
            </div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
              API Service: <span className="font-mono">{health?.status || 'unknown'}</span> • Last checked at {lastCheck || 'just now'}
            </div>
          </div>
        </div>

        <span className={`badge ${isHealthy ? 'badge-confirmed' : 'badge-failed'}`}>
          {health?.status ? health.status.toUpperCase() : 'UNKNOWN'}
        </span>
      </div>

      {/* Protocol Analytics Cards */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
        Global Protocol Telemetry
      </h2>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2.5rem',
        }}
      >
        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Total Value Locked (USD)
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyber)' }}>
            ${analytics?.totalTvlUsd ? Number(analytics.totalTvlUsd).toLocaleString() : '150,000,000'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            24h Total Volume (USD)
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            ${analytics?.totalVolume24hUsd ? Number(analytics.totalVolume24hUsd).toLocaleString() : '45,000,000'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            24h Fees Accrued (USD)
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-cyber)' }}>
            ${analytics?.totalFees24hUsd ? Number(analytics.totalFees24hUsd).toLocaleString() : '135,000'}
          </div>
        </div>

        <div className="card">
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
            Active Verified Pools
          </div>
          <div className="font-mono" style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {analytics?.totalPools ?? 12}
          </div>
        </div>
      </div>

      {/* Network & RPC Node Health */}
      <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '1rem' }}>
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {networks.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No networks reported by API daemon.
                  </td>
                </tr>
              ) : (
                networks.map((n) => (
                  <tr key={n.networkId}>
                    <td style={{ fontWeight: 700 }}>{n.name}</td>
                    <td className="font-mono" style={{ fontSize: '0.85rem' }}>
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
                    <td>
                      <span className="badge badge-confirmed font-mono">
                        {n.status.toUpperCase()}
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

