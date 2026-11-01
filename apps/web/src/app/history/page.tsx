'use client';

import React, { useState, useEffect } from 'react';
import { getTransactionHistory, RecordedTransaction } from '../../lib/tx-executor';

export default function HistoryPage() {
  const [history, setHistory] = useState<RecordedTransaction[]>([]);

  useEffect(() => {
    setHistory(getTransactionHistory());
    // Auto refresh every 2 seconds to reflect ongoing Confirmed -> Finalized state transitions
    const interval = setInterval(() => {
      setHistory(getTransactionHistory());
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleClear = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('omnifi_tx_history');
      setHistory([]);
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
            Transaction History
          </h1>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.9rem' }}>
            Complete audit trail of user-signed on-chain transactions and their finality progression
          </p>
        </div>

        {history.length > 0 && (
          <button onClick={handleClear} className="btn btn-secondary font-mono" style={{ fontSize: '0.8rem' }}>
            Clear Local Log
          </button>
        )}
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div className="table-container">
          <table className="table">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Action</th>
                <th>Network</th>
                <th>Summary</th>
                <th>Tx Hash</th>
                <th>Status Lifecycle (§26.4)</th>
                <th style={{ textAlign: 'right' }}>Explorer</th>
              </tr>
            </thead>
            <tbody>
              {history.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '3.5rem', color: 'var(--text-muted)' }}>
                    No recorded transactions in this browser session. Execute a swap or provide liquidity to record on-chain activity.
                  </td>
                </tr>
              ) : (
                history.map((tx) => {
                  const date = new Date(tx.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr key={tx.id || tx.txHash}>
                      <td className="font-mono" style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        {date}
                      </td>
                      <td>
                        <span className="badge badge-submitted font-mono" style={{ fontSize: '0.75rem' }}>
                          {tx.actionType.toUpperCase().replace('_', ' ')}
                        </span>
                      </td>
                      <td>
                        <span className="badge badge-submitted font-mono" style={{ fontSize: '0.75rem' }}>
                          {tx.networkId}
                        </span>
                      </td>
                      <td style={{ fontWeight: 600, fontSize: '0.85rem' }}>{tx.summary}</td>
                      <td className="font-mono" style={{ fontSize: '0.8rem' }}>
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                      </td>
                      <td>
                        <span
                          className={`badge ${
                            tx.status === 'finalized'
                              ? 'badge-finalized'
                              : tx.status === 'confirmed'
                              ? 'badge-confirmed'
                              : tx.status === 'failed'
                              ? 'badge-failed'
                              : 'badge-submitted'
                          }`}
                        >
                          {tx.status.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <a
                          href={tx.explorerUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-secondary font-mono"
                          style={{
                            padding: '0.3rem 0.6rem',
                            fontSize: '0.75rem',
                            textDecoration: 'none',
                            color: 'var(--accent-cyber)',
                          }}
                        >
                          View ↗
                        </a>
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
