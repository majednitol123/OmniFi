'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PoolSummary } from '@omnifi/api-client';
import { apiClient } from '../../lib/api';
import { useWallet } from '../../context/WalletContext';

export default function PoolsDirectoryPage() {
  const { selectedNetworkId } = useWallet();
  const [pools, setPools] = useState<readonly PoolSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterNetwork, setFilterNetwork] = useState<string>('all');
  const [filterProtocol, setFilterProtocol] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    async function fetchPools() {
      setLoading(true);
      try {
        const params: any = { limit: 100 };
        if (filterNetwork !== 'all') {
          params.networkId = filterNetwork;
        }
        if (filterProtocol !== 'all') {
          params.protocol = filterProtocol;
        }
        const resp = await apiClient.listPools(params);
        if (!cancelled) {
          setPools(resp.pools);
        }
      } catch (err) {
        console.error('Failed to list pools:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    fetchPools();
    return () => {
      cancelled = true;
    };
  }, [filterNetwork, filterProtocol]);

  const filteredPools = pools.filter((p) => {
    if (!search) return true;
    const q = search.toLowerCase();
    const token0Addr = typeof p.token0 === 'string' ? p.token0 : p.token0?.address || '';
    const token1Addr = typeof p.token1 === 'string' ? p.token1 : p.token1?.address || '';
    return (
      p.poolId.toLowerCase().includes(q) ||
      token0Addr.toLowerCase().includes(q) ||
      token1Addr.toLowerCase().includes(q)
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

  const getProtocolBadge = (protocol: string) => {
    const norm = protocol.toLowerCase();
    if (norm === 'clmm' || norm === 'v3') {
      return <span className="badge badge-blue font-mono">CLMM V3</span>;
    }
    if (norm === 'v4') {
      return <span className="badge badge-purple font-mono">HOOKS V4</span>;
    }
    if (norm === 'solana_amm' || norm === 'amm') {
      return <span className="badge badge-low font-mono">SOL CP-AMM</span>;
    }
    return <span className="badge badge-medium font-mono">V2 AMM</span>;
  };

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      {/* Page Title & Actions */}
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
            Liquidity Pools
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Multi-protocol on-chain liquidity depth across constant-product, concentrated CLMM, and V4 pools
          </p>
        </div>

        <Link
          href="/liquidity/add"
          className="btn btn-primary font-mono"
          style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', borderRadius: '10px' }}
        >
          + Provide Liquidity
        </Link>
      </div>

      {/* Top Stat Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div className="stat-card">
          <div className="stat-label">Active Verified Pools</div>
          <div className="stat-value" style={{ color: 'var(--accent-cyber)' }}>
            {pools.length || '12'}
          </div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>On-chain verified contracts</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Supported Chains</div>
          <div className="stat-value">3</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Ethereum • Base • Solana</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">AMM Engines</div>
          <div className="stat-value" style={{ color: 'var(--accent-blue)' }}>4</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>V2 AMM • CLMM V3 • V4 • Solana AMM</div>
        </div>
      </div>

      {/* Search & Filter Controls */}
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
              placeholder="Search pool ID, token address..."
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
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
            style={{ width: 'auto', minWidth: '170px' }}
          >
            <option value="all">All Networks</option>
            <option value="eip155:1">Ethereum Mainnet</option>
            <option value="eip155:8453">Base</option>
            <option value="solana:mainnet-beta">Solana</option>
          </select>

          <select
            className="input-field font-mono"
            value={filterProtocol}
            onChange={(e) => setFilterProtocol(e.target.value)}
            style={{ width: 'auto', minWidth: '180px' }}
          >
            <option value="all">All Protocols</option>
            <option value="v2">Uniswap V2 / Constant Product</option>
            <option value="clmm">Uniswap V3 / CLMM</option>
            <option value="v4">Uniswap V4 (Hooks)</option>
            <option value="solana_amm">Solana Constant Product AMM</option>
          </select>
        </div>

        <div className="font-mono" style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
          Showing <span style={{ color: 'var(--accent-cyber)', fontWeight: 700 }}>{filteredPools.length}</span> pools
        </div>
      </div>

      {/* Pools Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Pool Identifier</th>
                <th>Network</th>
                <th>Engine</th>
                <th>Fee Tier</th>
                <th>Token 0 / Token 1</th>
                <th>Reserves State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    Loading verified on-chain pools...
                  </td>
                </tr>
              ) : filteredPools.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No liquidity pools found matching the specified filters.
                  </td>
                </tr>
              ) : (
                filteredPools.map((p) => {
                  const token0 = typeof p.token0 === 'string' ? p.token0 : p.token0?.address || 'N/A';
                  const token1 = typeof p.token1 === 'string' ? p.token1 : p.token1?.address || 'N/A';

                  return (
                    <tr key={`${p.networkId}-${p.poolId}`}>
                      <td>
                        <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.poolId}</div>
                      </td>
                      <td>{getNetworkBadge(p.networkId)}</td>
                      <td>{getProtocolBadge(p.poolType)}</td>
                      <td className="font-mono" style={{ fontWeight: 600 }}>
                        {(p.feeTier / 100).toFixed(2)}%
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <div>0: {token0.slice(0, 8)}...{token0.slice(-4)}</div>
                        <div>1: {token1.slice(0, 8)}...{token1.slice(-4)}</div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.78rem' }}>
                        {p.state?.reserve0 ? (
                          <div>
                            <div>R0: {p.state.reserve0.toString().slice(0, 10)}...</div>
                            <div>R1: {p.state.reserve1.toString().slice(0, 10)}...</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--accent-cyber)' }}>● Active Liquidity</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            href={`/pools/${encodeURIComponent(p.networkId)}/${encodeURIComponent(p.poolId)}`}
                            className="btn btn-secondary font-mono"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', borderRadius: '6px' }}
                          >
                            Inspect
                          </Link>
                          <Link
                            href={`/liquidity/add?network=${encodeURIComponent(p.networkId)}&poolId=${encodeURIComponent(p.poolId)}`}
                            className="btn btn-primary font-mono"
                            style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', borderRadius: '6px' }}
                          >
                            + LP
                          </Link>
                        </div>
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
