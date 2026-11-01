'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PoolSummary } from '@omnifi/api-client';
import { useWallet } from '../../../context/WalletContext';
import { apiClient } from '../../../lib/api';
import { executeEvmTransaction, executeSolanaTransaction, TxStatus } from '../../../lib/tx-executor';

export default function RemoveLiquidityPage() {
  const { address, selectedNetworkId, isNetworkMismatch } = useWallet();

  const [pools, setPools] = useState<readonly PoolSummary[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');
  const [percent, setPercent] = useState<number>(50);
  const [liquidityAmount, setLiquidityAmount] = useState<string>('5000000');

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadPools() {
      try {
        const resp = await apiClient.listPools({ networkId: selectedNetworkId });
        setPools(resp.pools);
        if (resp.pools[0]) {
          setSelectedPoolId(resp.pools[0].poolId);
        }
      } catch (err) {
        console.error('Failed to load pools for remove liquidity:', err);
      }
    }
    loadPools();
  }, [selectedNetworkId]);

  const handleRemoveLiquidity = async () => {
    if (!address) return;
    setError(null);
    setTxStatus('preparing');

    try {
      const namespace = selectedNetworkId.startsWith('solana:') ? 'solana' : 'eip155';
      const pool = pools.find((p) => p.poolId === selectedPoolId);
      const protocol = (pool?.poolType as any) || (namespace === 'solana' ? 'amm' : 'v2');

      const prepared = await apiClient.prepareRemoveLiquidity({
        namespace,
        networkId: selectedNetworkId,
        userAddress: address,
        protocol,
        poolId: selectedPoolId,
        liquidity: liquidityAmount,
        amount0Min: '0',
        amount1Min: '0',
      });

      const summary = `Remove ${percent}% LP from ${selectedPoolId}`;

      if (namespace === 'eip155') {
        await executeEvmTransaction(
          address,
          selectedNetworkId,
          prepared.preparedTransaction,
          summary,
          (status, hash) => {
            setTxStatus(status);
            if (hash) setTxHash(hash);
          },
        );
      } else {
        await executeSolanaTransaction(
          address,
          selectedNetworkId,
          prepared.preparedTransaction,
          summary,
          (status, hash) => {
            setTxStatus(status);
            if (hash) setTxHash(hash);
          },
        );
      }
    } catch (err: any) {
      console.error('Remove liquidity error:', err);
      setTxStatus('failed');
      setError(err?.message || 'Transaction was rejected or failed');
    }
  };

  return (
    <div style={{ maxWidth: '580px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
            Remove Liquidity
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Burn pool shares to reclaim underlying token assets
          </p>
        </div>
        <Link href="/pools" className="btn btn-secondary font-mono" style={{ textDecoration: 'none' }}>
          ← View Pools
        </Link>
      </div>

      <div className="card">
        {/* Pool Selector */}
        <div style={{ marginBottom: '1.25rem' }}>
          <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            Select Active Pool
          </label>
          <select
            className="input-field font-mono"
            value={selectedPoolId}
            onChange={(e) => setSelectedPoolId(e.target.value)}
          >
            {pools.map((p) => (
              <option key={p.poolId} value={p.poolId}>
                {p.poolId} ({p.poolType.toUpperCase()})
              </option>
            ))}
          </select>
        </div>

        {/* Percentage Selector */}
        <div style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Amount to Withdraw</span>
            <span className="font-mono" style={{ color: 'var(--accent-cyber)', fontWeight: 700 }}>
              {percent}%
            </span>
          </div>

          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
            {[25, 50, 75, 100].map((p) => (
              <button
                key={p}
                className={`btn ${percent === p ? 'btn-primary' : 'btn-secondary'} font-mono`}
                style={{ flex: 1, padding: '0.4rem' }}
                onClick={() => {
                  setPercent(p);
                  setLiquidityAmount((p * 100000).toString());
                }}
              >
                {p}%
              </button>
            ))}
          </div>

          <div style={{ background: 'var(--surface-overlay)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
              Raw LP Units
            </div>
            <input
              type="text"
              className="input-field font-mono"
              value={liquidityAmount}
              onChange={(e) => setLiquidityAmount(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        {!address ? (
          <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled>
            Connect Wallet To Withdraw
          </button>
        ) : isNetworkMismatch ? (
          <button className="btn btn-secondary" style={{ width: '100%', padding: '0.85rem', color: 'var(--accent-amber)' }} disabled>
            Network Mismatch Detected
          </button>
        ) : (
          <button
            onClick={handleRemoveLiquidity}
            disabled={txStatus === 'preparing' || txStatus === 'submitting'}
            className="btn btn-primary font-mono"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {txStatus === 'preparing'
              ? 'Preparing Unsigned Payload...'
              : txStatus === 'submitting'
              ? 'Waiting for Wallet Signature...'
              : `Withdraw ${percent}% Liquidity`}
          </button>
        )}

        {/* Transaction Lifecycle Status (§26.4) */}
        {txStatus !== 'idle' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Unwind Lifecycle</span>
              <span className={`badge badge-${txStatus}`}>{txStatus.toUpperCase()}</span>
            </div>

            {txHash && (
              <div className="font-mono" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
              </div>
            )}

            {error && (
              <div style={{ color: 'var(--accent-crimson)', fontSize: '0.75rem', marginTop: '0.4rem' }}>
                {error}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
