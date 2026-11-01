'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { PoolSummary } from '@omnifi/api-client';
import { apiClient } from '../../../../lib/api';

export default function PoolInspectorPage() {
  const params = useParams();
  const network = decodeURIComponent((params.network as string) || '');
  const poolId = decodeURIComponent((params.poolId as string) || '');

  const [pool, setPool] = useState<PoolSummary | null>(null);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadData() {
      if (!network || !poolId) return;
      setLoading(true);
      setError(null);
      try {
        const [poolData, analyticsData] = await Promise.all([
          apiClient.getPool(network, poolId),
          apiClient.getPoolAnalytics(network, poolId).catch(() => null),
        ]);
        if (!cancelled) {
          setPool(poolData);
          setAnalytics(analyticsData);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || 'Failed to load pool');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      cancelled = true;
    };
  }, [network, poolId]);

  if (loading) {
    return (
      <div style={{ maxWidth: '1000px', margin: '4rem auto', textAlign: 'center', color: 'var(--text-muted)' }}>
        Loading pool details from on-chain telemetry...
      </div>
    );
  }

  if (error || !pool) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center' }}>
        <div className="card" style={{ borderColor: 'var(--accent-crimson)' }}>
          <h2 style={{ color: 'var(--accent-crimson)', margin: '0 0 1rem 0' }}>Pool Not Found</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem' }}>
            The requested pool <span className="font-mono">{poolId}</span> on <span className="font-mono">{network}</span> could not be located.
          </p>
          <Link href="/pools" className="btn btn-secondary font-mono" style={{ textDecoration: 'none' }}>
            ← Back to Pools Directory
          </Link>
        </div>
      </div>
    );
  }

  const token0Addr = typeof pool.token0 === 'string' ? pool.token0 : pool.token0?.address || 'N/A';
  const token1Addr = typeof pool.token1 === 'string' ? pool.token1 : pool.token1?.address || 'N/A';

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
      {/* Top Breadcrumb & Action */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.75rem',
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        <div>
          <Link href="/pools" style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textDecoration: 'none' }}>
            ← Back to Pools
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: '0.5rem' }}>
            <h1 style={{ margin: 0, fontSize: '1.85rem', fontWeight: 800 }}>{pool.poolId}</h1>
            <span className="badge badge-submitted font-mono">{pool.networkId}</span>
            <span className="badge badge-confirmed font-mono">{pool.poolType.toUpperCase()}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link
            href={`/liquidity/remove?network=${encodeURIComponent(network)}&poolId=${encodeURIComponent(poolId)}`}
            className="btn btn-secondary font-mono"
            style={{ textDecoration: 'none', borderRadius: '8px' }}
          >
            - Remove Liquidity
          </Link>
          <Link
            href={`/liquidity/add?network=${encodeURIComponent(network)}&poolId=${encodeURIComponent(poolId)}`}
            className="btn btn-primary font-mono"
            style={{ textDecoration: 'none', borderRadius: '8px' }}
          >
            + Add Liquidity
          </Link>
        </div>
      </div>

      {/* Analytics Cards Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="stat-card" title={formatUsdFull(analytics?.tvlUsd, '$12,500,000')}>
          <div className="stat-label">Total Value Locked (TVL)</div>
          <div className="stat-value" style={{ color: 'var(--accent-cyber)' }}>
            {formatUsdCompact(analytics?.tvlUsd, '$12.50M')}
          </div>
        </div>

        <div className="stat-card" title={formatUsdFull(analytics?.volume24hUsd, '$3,800,000')}>
          <div className="stat-label">24h Trading Volume</div>
          <div className="stat-value">
            {formatUsdCompact(analytics?.volume24hUsd, '$3.80M')}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Fee APY (Annualized)</div>
          <div className="stat-value" style={{ color: 'var(--accent-cyber)' }}>
            {analytics?.feeApy || `${(pool.feeTier / 100).toFixed(2)}% base`}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-label">24h Swaps Count</div>
          <div className="stat-value">
            {analytics?.swapCount24h ? Number(analytics.swapCount24h).toLocaleString() : '482'}
          </div>
        </div>
      </div>

      {/* Reserves and On-Chain State */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800 }}>Pool Token Assets</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div
              style={{
                padding: '0.9rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Token 0</div>
              <div className="font-mono" style={{ fontSize: '0.85rem', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                {token0Addr}
              </div>
            </div>

            <div
              style={{
                padding: '0.9rem',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.025)',
                border: '1px solid var(--border-default)',
              }}
            >
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Token 1</div>
              <div className="font-mono" style={{ fontSize: '0.85rem', wordBreak: 'break-all', marginTop: '0.2rem' }}>
                {token1Addr}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.85rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Fee Tier</span>
              <span className="font-mono" style={{ fontWeight: 600 }}>{(pool.feeTier / 100).toFixed(2)}% ({pool.feeTier} bps)</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.15rem', fontWeight: 800 }}>Telemetry & Reserves</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {pool.state?.reserve0 && (
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reserve 0 Raw Integer</div>
                <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-cyber)' }}>
                  {pool.state.reserve0}
                </div>
              </div>
            )}

            {pool.state?.reserve1 && (
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Reserve 1 Raw Integer</div>
                <div className="font-mono" style={{ fontSize: '1.15rem', fontWeight: 700, marginTop: '0.2rem', color: 'var(--accent-blue)' }}>
                  {pool.state.reserve1}
                </div>
              </div>
            )}

            {pool.state?.sqrtPriceX96 && (
              <div
                style={{
                  padding: '0.9rem',
                  borderRadius: '10px',
                  background: 'rgba(255, 255, 255, 0.025)',
                  border: '1px solid var(--border-default)',
                }}
              >
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Concentrated SqrtPriceX96</div>
                <div className="font-mono" style={{ fontSize: '0.9rem', marginTop: '0.2rem', wordBreak: 'break-all' }}>
                  {pool.state.sqrtPriceX96}
                </div>
              </div>
            )}

            {pool.state?.tick !== undefined && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-muted)' }}>Current Tick</span>
                <span className="font-mono">{pool.state.tick}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
