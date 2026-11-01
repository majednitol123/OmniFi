'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { PositionSummary } from '@omnifi/api-client';
import { useWallet } from '../../context/WalletContext';
import { apiClient } from '../../lib/api';
import { executeEvmTransaction, executeSolanaTransaction, TxStatus } from '../../lib/tx-executor';

export default function PositionsPage() {
  const { address, selectedNetworkId, openWalletModal } = useWallet();

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
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, margin: '0 0 0.4rem 0', letterSpacing: '-0.02em' }}>
            My Liquidity Positions
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.92rem' }}>
            Manage concentrated liquidity ranges, view earned yields, and harvest protocol fees
          </p>
        </div>

        <Link href="/liquidity/add" className="btn btn-primary font-mono" style={{ padding: '0.65rem 1.25rem', fontSize: '0.9rem', borderRadius: '10px' }}>
          + New Position
        </Link>
      </div>

      {!address ? (
        <div className="card" style={{ textAlign: 'center', padding: '4rem 1.5rem', maxWidth: '580px', margin: '2rem auto' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'rgba(0, 229, 153, 0.1)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              color: 'var(--accent-cyber)',
              margin: '0 auto 1.25rem auto',
            }}
          >
            🔒
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, marginBottom: '0.6rem' }}>Wallet Not Connected</h2>
          <p style={{ color: 'var(--text-secondary)', margin: '0 auto 1.75rem auto', fontSize: '0.92rem', lineHeight: 1.5 }}>
            Connect your browser wallet (MetaMask, Coinbase Wallet, or Phantom) to inspect and manage your active liquidity positions.
          </p>
          <button
            onClick={openWalletModal}
            className="btn btn-primary font-mono"
            style={{ padding: '0.75rem 1.5rem', fontSize: '0.95rem', borderRadius: '10px' }}
          >
            Connect Wallet Now
          </button>
        </div>
      ) : (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div className="table-container">
            <table className="table">
              <thead>
                <tr>
                  <th>Position #</th>
                  <th>Pool Identifier</th>
                  <th>Tick Range</th>
                  <th>Liquidity Units</th>
                  <th>Unclaimed Fees</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      Querying on-chain position records for {address}...
                    </td>
                  </tr>
                ) : positions.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                      <div style={{ marginBottom: '1rem', fontSize: '0.95rem' }}>
                        No liquidity positions found for {address.slice(0, 8)}... on {selectedNetworkId}.
                      </div>
                      <Link
                        href="/liquidity/add"
                        className="btn btn-secondary font-mono"
                        style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}
                      >
                        + Create Your First Position
                      </Link>
                    </td>
                  </tr>
                ) : (
                  positions.map((pos) => {
                    const isCollecting = activeCollectingId === pos.positionId;

                    return (
                      <tr key={pos.positionId}>
                        <td className="font-mono" style={{ fontWeight: 800, color: 'var(--accent-cyber)' }}>
                          #{pos.positionId}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700 }}>{pos.poolId}</div>
                          <span className="badge badge-submitted font-mono" style={{ fontSize: '0.7rem', marginTop: '0.2rem' }}>
                            {(pos.feeTier / 100).toFixed(2)}% Fee Tier
                          </span>
                        </td>
                        <td className="font-mono" style={{ fontSize: '0.82rem' }}>
                          [{pos.tickLower} ↔ {pos.tickUpper}]
                        </td>
                        <td className="font-mono" style={{ fontWeight: 600 }}>{pos.liquidity}</td>
                        <td className="font-mono" style={{ color: 'var(--accent-cyber)', fontSize: '0.82rem' }}>
                          <div>0: {pos.tokensOwed0}</div>
                          <div>1: {pos.tokensOwed1}</div>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                            <button
                              onClick={() => handleCollectFees(pos)}
                              disabled={isCollecting || txStatus === 'submitting'}
                              className="btn btn-secondary font-mono"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', color: 'var(--accent-cyber)', borderRadius: '6px' }}
                            >
                              {isCollecting ? 'Harvesting...' : 'Collect Fees'}
                            </button>
                            <Link
                              href={`/liquidity/remove?poolId=${encodeURIComponent(pos.poolId)}&positionId=${encodeURIComponent(pos.positionId)}`}
                              className="btn btn-secondary font-mono"
                              style={{ padding: '0.4rem 0.75rem', fontSize: '0.78rem', borderRadius: '6px' }}
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
            padding: '1.25rem',
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
            <div className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Hash: {txHash.slice(0, 10)}...{txHash.slice(-8)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
