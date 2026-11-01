'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PositionSummary } from '@omnifi/api-client';
import { useWallet } from '../../context/WalletContext';
import { apiClient } from '../../lib/api';
import { executeEvmTransaction, executeSolanaTransaction, TxStatus } from '../../lib/tx-executor';

export default function PositionsPage() {
  const { address, selectedNetworkId } = useWallet();

  const [positions, setPositions] = useState<readonly PositionSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txHash, setTxHash] = useState<string | null>(null);
  const [activeCollectingId, setActiveCollectingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function loadPositions() {
      if (!address) {
        setPositions([]);
        return;
      }
      setLoading(true);
      try {
        const resp = await apiClient.listPositions({
          owner: address,
          networkId: selectedNetworkId,
        });
        if (!cancelled) {
          setPositions(resp.positions);
        }
      } catch (err) {
        console.error('Failed to load positions:', err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }
    loadPositions();
    return () => {
      cancelled = true;
    };
  }, [address, selectedNetworkId]);

  const handleCollectFees = async (pos: PositionSummary) => {
    if (!address) return;
    setActiveCollectingId(pos.positionId);
    setError(null);
    setTxStatus('preparing');

    try {
      const namespace = selectedNetworkId.startsWith('solana:') ? 'solana' : 'eip155';
      const prepared = await apiClient.prepareCollectFees({
        namespace,
        networkId: selectedNetworkId,
        owner: address,
        positionId: pos.positionId,
        poolId: pos.poolId,
      });

      const summary = `Collect Fees from Position #${pos.positionId}`;

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
      console.error('Collect fees error:', err);
      setTxStatus('failed');
      setError(err?.message || 'Transaction was rejected or failed');
    } finally {
      setActiveCollectingId(null);
    }
  };

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
            My Liquidity Positions
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Manage concentrated liquidity ranges, view earned yields, and harvest protocol fees
          </p>
        </div>

        <Link href="/liquidity/add" className="btn btn-primary font-mono" style={{ textDecoration: 'none' }}>
          + New Position
        </Link>
      </div>

      {!address ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Wallet Not Connected</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Connect your browser wallet using the button in the top navigation to inspect your active LP positions.
          </p>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Position #</th>
                  <th>Pool</th>
                  <th>Tick Range</th>
                  <th>Liquidity Units</th>
                  <th>Unclaimed Fees</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      Querying on-chain position records...
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                      No liquidity positions found for connected wallet on {selectedNetworkId}.
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => {
                    const isCollecting = activeCollectingId === pos.positionId;

                    return (
                      <tr key={pos.positionId}>
                        <td className="font-mono" style={{ fontWeight: 700 }}>
                          #{pos.positionId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{pos.poolId}</div>
                          <span className="badge badge-submitted font-mono" style={{ fontSize: '0.7rem' }}>
                            {(pos.feeTier / 100).toFixed(2)}% Tier
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                          [{pos.tickLower} ↔ {pos.tickUpper}]
                        </td>
                        <td className="font-mono">{pos.liquidity}</td>
                        <td className="font-mono" style={{ color: 'var(--accent-cyber)', fontSize: '0.8rem' }}>
                          <div>0: {pos.tokensOwed0}</div>
                          <div>1: {pos.tokensOwed1}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleCollectFees(pos)}
                              disabled={isCollecting || txStatus === 'submitting'}
                              className="btn btn-secondary font-mono"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', color: 'var(--accent-cyber)' }}
                            >
                              {isCollecting ? 'Harvesting...' : 'Collect Fees'}
                            </button>
                            <Link
                              href={`/liquidity/remove?poolId=${encodeURIComponent(pos.poolId)}&positionId=${encodeURIComponent(pos.positionId)}`}
                              className="btn btn-secondary font-mono"
                              style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', textDecoration: 'none' }}
                            >
                              Unwind
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
      )}

      {/* Transaction status alert */}
      {txStatus !== 'idle' && (
        <div
          className="card"
          style={{
            marginTop: '1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderColor: 'var(--accent-cyber)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span className={`badge badge-${txStatus}`}>{txStatus.toUpperCase()}</span>
            <span style={{ fontSize: '0.9rem' }}>
              {txStatus === 'preparing'
                ? 'Preparing unsigned fee collection payload...'
                : txStatus === 'submitting'
                ? 'Sign transaction in your browser wallet...'
                : txStatus === 'submitted'
                ? 'Harvest transaction submitted to mempool...'
                : txStatus === 'confirmed'
                ? 'Fee harvest confirmed on-chain!'
                : txStatus === 'finalized'
                ? 'Fee harvest finalized permanently.'
                : error || 'Operation failed'}
            </span>
          </div>

          {txHash && (
            <div className="font-mono" style={{ fontSize: '0.8rem' }}>
              Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
