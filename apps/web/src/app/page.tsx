'use client';

import React from 'react';
import { TradingCockpit } from '../components/trading/TradingCockpit';

export default function SwapPage() {
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
        <h1
          style={{
            fontSize: '2rem',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            margin: '0 0 0.5rem 0',
          }}
        >
          High-Precision Multi-Chain Swap
        </h1>
        <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '0.95rem' }}>
          Decoupled client-side transaction signing across Ethereum, Base, and Solana
        </p>
      </div>

      <TradingCockpit />
    </div>
  );
}
