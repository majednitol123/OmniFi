import { SwapQuote } from '@omnifi/domain';
import React, { useEffect, useState } from 'react';

export interface QuoteCardProps {
  quote: SwapQuote | null;
  isLoading: boolean;
  onRefresh?: (() => void) | undefined;
}

export const QuoteCard: React.FC<QuoteCardProps> = ({ quote, isLoading, onRefresh }) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (!quote) {
      setProgress(100);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, quote.expiresAt - now);
      const pct = (remaining / quote.ttlMs) * 100;
      setProgress(pct);

      if (remaining <= 0 && onRefresh) {
        onRefresh();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [quote, onRefresh]);

  if (isLoading && !quote) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.03)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '24px',
          textAlign: 'center',
          color: '#94a3b8',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <div style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</div>
        <p style={{ marginTop: '8px', fontSize: '14px' }}>Finding optimal routing quotes...</p>
      </div>
    );
  }

  if (!quote) {
    return (
      <div
        style={{
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px dashed rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '32px 24px',
          textAlign: 'center',
          color: '#64748b',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        <p style={{ fontSize: '14px', margin: 0 }}>Enter swap amounts above to generate an execution quote</p>
      </div>
    );
  }

  return (
    <div
      style={{
        background: 'linear-gradient(180deg, rgba(30, 41, 59, 0.4) 0%, rgba(15, 23, 42, 0.6) 100%)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        borderRadius: '16px',
        padding: '20px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: '#f8fafc',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.25)',
      }}
    >
      {/* Freshness Progress Bar */}
      <div
        style={{
          width: '100%',
          height: '3px',
          background: 'rgba(255, 255, 255, 0.08)',
          borderRadius: '2px',
          marginBottom: '16px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            background: progress > 25 ? '#06b6d4' : '#ef4444',
            transition: 'width 0.1s linear',
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '14px',
        }}
      >
        <span style={{ fontSize: '13px', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Expected Output
        </span>
        <button
          onClick={onRefresh}
          disabled={isLoading}
          style={{
            background: 'transparent',
            border: 'none',
            color: '#38bdf8',
            fontSize: '12px',
            cursor: 'pointer',
            padding: '4px 8px',
            borderRadius: '6px',
          }}
        >
          {isLoading ? 'Refreshing...' : '↻ Refresh'}
        </button>
      </div>

      {/* Output Amount Large Monospace Display */}
      <div style={{ marginBottom: '16px' }}>
        <div
          style={{
            fontSize: '28px',
            fontWeight: 700,
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            letterSpacing: '-0.02em',
            color: '#38bdf8',
          }}
        >
          {quote.amountOut.toString()}
        </div>
        <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
          Base units • Minimum received: {((quote.amountOut * 995n) / 1000n).toString()}
        </div>
      </div>

      {/* Metric Breakdown Table */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '12px',
          padding: '12px',
          background: 'rgba(15, 23, 42, 0.4)',
          borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          fontSize: '12px',
        }}
      >
        <div>
          <span style={{ color: '#94a3b8' }}>Execution Rate:</span>
          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>
            1 : {quote.executionPrice}
          </div>
        </div>
        <div>
          <span style={{ color: '#94a3b8' }}>Routes Selected:</span>
          <div style={{ fontFamily: 'monospace', fontWeight: 600, color: '#e2e8f0', marginTop: '2px' }}>
            {quote.routes.length} {quote.splits && quote.splits.length > 1 ? `(${quote.splits.map(s => `${s.percentage}%`).join('/')})` : 'Path'}
          </div>
        </div>
      </div>
    </div>
  );
};
