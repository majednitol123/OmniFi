'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { TokenResponse, PoolSummary } from '@omnifi/api-client';
import { useWallet } from '../../../context/WalletContext';
import { apiClient } from '../../../lib/api';
import { executeEvmTransaction, executeSolanaTransaction, TxStatus } from '../../../lib/tx-executor';

export default function AddLiquidityPage() {
  const { walletType, address, selectedNetworkId, isNetworkMismatch } = useWallet();

  const [tokens, setTokens] = useState<readonly TokenResponse[]>([]);
  const [pools, setPools] = useState<readonly PoolSummary[]>([]);
  const [selectedPoolId, setSelectedPoolId] = useState<string>('');

  const [mode, setMode] = useState<'v2' | 'clmm'>('v2');
  const [token0, setToken0] = useState<string>('');
  const [token1, setToken1] = useState<string>('');
  const [amount0, setAmount0] = useState<string>('100');
  const [amount1, setAmount1] = useState<string>('100');
  const [tickLower, setTickLower] = useState<number>(-887220);
  const [tickUpper, setTickUpper] = useState<number>(887220);
  const [feeTier, setFeeTier] = useState<number>(3000);

  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadData() {
      try {
        const [tokenResp, poolResp] = await Promise.all([
          apiClient.listTokens(selectedNetworkId),
          apiClient.listPools({ networkId: selectedNetworkId }),
        ]);
        setTokens(tokenResp.tokens);
        setPools(poolResp.pools);

        const first = poolResp.pools[0];
        if (first) {
          setSelectedPoolId(first.poolId);
          const t0 = typeof first.token0 === 'string' ? first.token0 : first.token0?.address;
          const t1 = typeof first.token1 === 'string' ? first.token1 : first.token1?.address;
          setToken0(t0 || '');
          setToken1(t1 || '');
          setFeeTier(first.feeTier);
          setMode(first.poolType === 'clmm' || first.poolType === 'v3' ? 'clmm' : 'v2');
        } else if (tokenResp.tokens[0] && tokenResp.tokens[1]) {
          setToken0(tokenResp.tokens[0].address);
          setToken1(tokenResp.tokens[1].address);
        }
      } catch (err) {
        console.error('Failed to load add-liquidity data:', err);
      }
    }
    loadData();
  }, [selectedNetworkId]);

  const handlePoolChange = (poolId: string) => {
    setSelectedPoolId(poolId);
    const found = pools.find((p) => p.poolId === poolId);
    if (found) {
      const t0 = typeof found.token0 === 'string' ? found.token0 : found.token0?.address;
      const t1 = typeof found.token1 === 'string' ? found.token1 : found.token1?.address;
      setToken0(t0 || '');
      setToken1(t1 || '');
      setFeeTier(found.feeTier);
      setMode(found.poolType === 'clmm' || found.poolType === 'v3' ? 'clmm' : 'v2');
    }
  };

  const handleAddLiquidity = async () => {
    if (!address) return;
    setError(null);
    setTxStatus('preparing');

    try {
      const namespace = selectedNetworkId.startsWith('solana:') ? 'solana' : 'eip155';
      const protocol = namespace === 'solana' ? 'amm' : mode;

      const rawAmount0 = BigInt(Math.floor(Number(amount0) * 1e6)).toString();
      const rawAmount1 = BigInt(Math.floor(Number(amount1) * 1e6)).toString();
      const min0 = (BigInt(rawAmount0) * 995n / 1000n).toString();
      const min1 = (BigInt(rawAmount1) * 995n / 1000n).toString();

      const prepared = await apiClient.prepareAddLiquidity({
        namespace,
        networkId: selectedNetworkId,
        userAddress: address,
        protocol,
        token0,
        token1,
        amount0Desired: rawAmount0,
        amount1Desired: rawAmount1,
        amount0Min: min0,
        amount1Min: min1,
        tickLower: mode === 'clmm' ? tickLower : undefined,
        tickUpper: mode === 'clmm' ? tickUpper : undefined,
        feeTier,
      });

      const summary = `Add Liquidity ${amount0} / ${amount1} to ${selectedPoolId || 'Pool'}`;

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
      console.error('Add liquidity error:', err);
      setTxStatus('failed');
      setError(err?.message || 'Transaction was rejected or failed');
    }
  };

  return (
    <div style={{ maxWidth: '640px', margin: '2rem auto', padding: '0 1rem' }}>
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.4rem 0' }}>
            Provide Liquidity
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Supply non-custodial capital to automated market maker pools
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
            Select Target Pool
          </label>
          <select
            className="input-field font-mono"
            value={selectedPoolId}
            onChange={(e) => handlePoolChange(e.target.value)}
          >
            {pools.map((p) => (
              <option key={p.poolId} value={p.poolId}>
                {p.poolId} ({p.poolType.toUpperCase()} - {(p.feeTier / 100).toFixed(2)}%)
              </option>
            ))}
          </select>
        </div>

        {/* Mode Selector */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <button
            className={`btn ${mode === 'v2' ? 'btn-primary' : 'btn-secondary'} font-mono`}
            style={{ flex: 1 }}
            onClick={() => setMode('v2')}
          >
            Constant Product (V2 / AMM)
          </button>
          <button
            className={`btn ${mode === 'clmm' ? 'btn-primary' : 'btn-secondary'} font-mono`}
            style={{ flex: 1 }}
            onClick={() => setMode('clmm')}
          >
            Concentrated (CLMM / V3)
          </button>
        </div>

        {/* Inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.5rem' }}>
          <div style={{ background: 'var(--surface-overlay)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>Deposit Token 0</span>
              <span className="font-mono">{token0.slice(0, 10)}...</span>
            </div>
            <input
              type="number"
              className="input-field font-mono"
              placeholder="0.0"
              value={amount0}
              onChange={(e) => setAmount0(e.target.value)}
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
            />
          </div>

          <div style={{ background: 'var(--surface-overlay)', padding: '1rem', borderRadius: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              <span>Deposit Token 1</span>
              <span className="font-mono">{token1.slice(0, 10)}...</span>
            </div>
            <input
              type="number"
              className="input-field font-mono"
              placeholder="0.0"
              value={amount1}
              onChange={(e) => setAmount1(e.target.value)}
              style={{ fontSize: '1.2rem', fontWeight: 700 }}
            />
          </div>

          {mode === 'clmm' && (
            <div
              style={{
                background: 'rgba(0, 229, 153, 0.04)',
                border: '1px solid rgba(0, 229, 153, 0.2)',
                borderRadius: '8px',
                padding: '1rem',
              }}
            >
              <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.75rem', color: 'var(--accent-cyber)' }}>
                Concentrated Price Boundaries
              </div>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Tick Lower
                  </label>
                  <input
                    type="number"
                    className="input-field font-mono"
                    value={tickLower}
                    onChange={(e) => setTickLower(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                    Tick Upper
                  </label>
                  <input
                    type="number"
                    className="input-field font-mono"
                    value={tickUpper}
                    onChange={(e) => setTickUpper(parseInt(e.target.value, 10) || 0)}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Button */}
        {!address ? (
          <button className="btn btn-primary" style={{ width: '100%', padding: '0.85rem' }} disabled>
            Connect Wallet To Provide Liquidity
          </button>
        ) : isNetworkMismatch ? (
          <button className="btn btn-secondary" style={{ width: '100%', padding: '0.85rem', color: 'var(--accent-amber)' }} disabled>
            Network Mismatch Detected
          </button>
        ) : (
          <button
            onClick={handleAddLiquidity}
            disabled={txStatus === 'preparing' || txStatus === 'submitting'}
            className="btn btn-primary font-mono"
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {txStatus === 'preparing'
              ? 'Preparing Unsigned Payload...'
              : txStatus === 'submitting'
              ? 'Waiting for Wallet Signature...'
              : 'Sign & Deposit Liquidity'}
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
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Deposit Lifecycle</span>
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
