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

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
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
            Liquidity Pools
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Multi-protocol on-chain liquidity depth across constant-product and concentrated pools
          </p>
        </div>

        <Link
          href="/liquidity/add"
          className="btn btn-primary font-mono"
          style={{ textDecoration: 'none' }}
        >
          + Provide Liquidity
        </Link>
      </div>

      {/* Controls & Filters */}
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
            placeholder="Search by pool id or token address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ maxWidth: '360px' }}
          />

          <select
            className="input-field font-mono"
            value={filterNetwork}
            onChange={(e) => setFilterNetwork(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Networks</option>
            <option value="eip155:1">Ethereum Mainnet</option>
            <option value="eip155:8453">Base</option>
            <option value="solana:mainnet-beta">Solana Mainnet-Beta</option>
          </select>

          <select
            className="input-field font-mono"
            value={filterProtocol}
            onChange={(e) => setFilterProtocol(e.target.value)}
            style={{ width: 'auto' }}
          >
            <option value="all">All Protocols</option>
            <option value="v2">Uniswap V2 / Constant Product</option>
            <option value="clmm">Uniswap V3 / CLMM</option>
            <option value="v4">Uniswap V4 (Hooks)</option>
            <option value="solana_amm">Solana Constant Product AMM</option>
          </select>
        </div>

        <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
          Showing {filteredPools.length} pools
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
                <th>Protocol</th>
                <th>Fee Tier</th>
                <th>Token 0 / Token 1</th>
                <th>Reserves State</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    Loading real on-chain pools...
                  </td>
                </tr>
              ) : filteredPools.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No liquidity pools found matching query filters.
                  </td>
                </tr>
              ) : (
                filteredPools.map((p) => {
                  const token0 = typeof p.token0 === 'string' ? p.token0 : p.token0?.address || 'N/A';
                  const token1 = typeof p.token1 === 'string' ? p.token1 : p.token1?.address || 'N/A';
                  const isSolana = p.networkId.startsWith('solana:');

                  return (
                    <tr key={`${p.networkId}-${p.poolId}`}>
                      <td>
                        <div style={{ fontWeight: 700 }}>{p.poolId}</div>
                      </td>
                      <td>
                        <span className="badge badge-submitted font-mono" style={{ fontSize: '0.75rem' }}>
                          {isSolana ? 'Solana' : p.networkId === 'eip155:8453' ? 'Base' : 'Ethereum'}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-confirmed font-mono" style={{ fontSize: '0.75rem' }}>
                          {p.poolType.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-mono">{(p.feeTier / 100).toFixed(2)}%</td>
                      <td className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        <div>0: {token0.slice(0, 10)}...{token0.slice(-6)}</div>
                        <div>1: {token1.slice(0, 10)}...{token1.slice(-6)}</div>
                      </td>
                      <td className="font-mono" style={{ fontSize: '0.75rem' }}>
                        {p.state?.reserve0 ? (
                          <div>
                            <div>R0: {p.state.reserve0.toString().slice(0, 12)}</div>
                            <div>R1: {p.state.reserve1.toString().slice(0, 12)}</div>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>Active</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <Link
                            href={`/pools/${encodeURIComponent(p.networkId)}/${encodeURIComponent(p.poolId)}`}
                            className="btn btn-secondary font-mono"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
                          >
                            Inspect
                          </Link>
                          <Link
                            href={`/liquidity/add?network=${encodeURIComponent(p.networkId)}&poolId=${encodeURIComponent(p.poolId)}`}
                            className="btn btn-primary font-mono"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
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

