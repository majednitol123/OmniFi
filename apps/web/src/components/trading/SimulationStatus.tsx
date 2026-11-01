import React from 'react';

export type SimulationState = 'idle' | 'simulating' | 'success' | 'error';

export interface SimulationStatusProps {
  state: SimulationState;
  estimatedUnits?: string | undefined;
  errorMessage?: string | undefined;
}

export const SimulationStatus: React.FC<SimulationStatusProps> = ({
  state,
  estimatedUnits,
  errorMessage,
}) => {
  if (state === 'idle') {
    return null;
  }

  if (state === 'simulating') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.2)',
          borderRadius: '8px',
          color: '#38bdf8',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginTop: '10px',
        }}
      >
        <span style={{ display: 'inline-block', animation: 'spin 1s linear infinite' }}>⏳</span>
        <span>Simulating transaction pre-flight execution...</span>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(16, 185, 129, 0.08)',
          border: '1px solid rgba(16, 185, 129, 0.2)',
          borderRadius: '8px',
          color: '#34d399',
          fontSize: '12px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          marginTop: '10px',
        }}
      >
        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>✓</span>
          <span>Simulation Passed</span>
        </span>
        {estimatedUnits && (
          <span style={{ fontFamily: 'monospace', fontWeight: 600 }}>
            {estimatedUnits}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '8px 12px',
        background: 'rgba(239, 68, 68, 0.1)',
        border: '1px solid rgba(239, 68, 68, 0.3)',
        borderRadius: '8px',
        color: '#f87171',
        fontSize: '12px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginTop: '10px',
      }}
    >
      <div style={{ fontWeight: 600, marginBottom: '2px' }}>✕ Pre-flight Simulation Failed</div>
      <div style={{ color: '#fca5a5', fontSize: '11px' }}>
        {errorMessage ?? 'Transaction would revert on-chain. Please check slippage or liquidity.'}
      </div>
    </div>
  );
};
