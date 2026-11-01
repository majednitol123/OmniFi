import { AssetRef, SwapQuote } from '@omnifi/domain';
import React, { useState } from 'react';
import { PriceImpactIndicator } from './PriceImpactIndicator';
import { QuoteCard } from './QuoteCard';
import { RouteVisualizer } from './RouteVisualizer';
import { SimulationState, SimulationStatus } from './SimulationStatus';
import { SlippageModal } from './SlippageModal';

export interface TradingCockpitProps {
  initialTokenIn?: AssetRef | undefined;
  initialTokenOut?: AssetRef | undefined;
  quote?: (SwapQuote | null) | undefined;
  isLoading?: boolean | undefined;
  onAmountInChange?: ((amount: string) => void) | undefined;
  onRefreshQuote?: (() => void) | undefined;
  onExecuteSwap?: (() => void) | undefined;
}

export const TradingCockpit: React.FC<TradingCockpitProps> = ({
  quote = null,
  isLoading = false,
  onAmountInChange,
  onRefreshQuote,
  onExecuteSwap,
}) => {
  const [amountIn, setAmountIn] = useState('1000000');
  const [slippageBps, setSlippageBps] = useState(50); // 0.5%
  const [isSlippageOpen, setIsSlippageOpen] = useState(false);
  const [isImpactConfirmed, setIsImpactConfirmed] = useState(false);
  const [simulationState, setSimulationState] = useState<SimulationState>(
    quote ? 'success' : 'idle',
  );

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setAmountIn(val);
    if (onAmountInChange) {
      onAmountInChange(val);
    }
  };

  const isHighImpact =
    quote && (quote.priceImpact.level === 'high' || quote.priceImpact.level === 'critical');
  const isExecutionBlocked = Boolean(isHighImpact && !isImpactConfirmed);

  return (
    <div
      style={{
        maxWidth: '460px',
        margin: '0 auto',
        padding: '24px',
        background: '#090d16',
        borderRadius: '24px',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        color: '#f8fafc',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6)',
      }}
    >
      {/* Top Header */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: '#06b6d4',
              boxShadow: '0 0 10px #06b6d4',
            }}
          />
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0, letterSpacing: '-0.02em' }}>
            OmniFi Swap
          </h2>
        </div>

        {/* Slippage Settings Button */}
        <button
          onClick={() => setIsSlippageOpen(true)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(255, 255, 255, 0.04)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px 12px',
            borderRadius: '10px',
            color: '#94a3b8',
            fontSize: '12px',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <span>⚙ Slippage:</span>
          <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>
            {(slippageBps / 100).toFixed(1)}%
          </span>
        </button>
      </div>

      {/* Input Token Box */}
      <div
        style={{
          background: 'rgba(15, 23, 42, 0.6)',
          border: '1px solid rgba(255, 255, 255, 0.06)',
          borderRadius: '16px',
          padding: '16px',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
          <span style={{ fontSize: '12px', color: '#94a3b8' }}>You Pay</span>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Balance: 10,000.00</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <input
            type="text"
            value={amountIn}
            onChange={handleAmountChange}
            placeholder="0"
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              fontSize: '24px',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: '#f8fafc',
              outline: 'none',
            }}
          />
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.08)',
              padding: '6px 12px',
              borderRadius: '10px',
              fontWeight: 600,
              fontSize: '14px',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <span>USDC</span>
          </div>
        </div>
      </div>

      {/* Quote Display Card */}
      <QuoteCard quote={quote} isLoading={isLoading} onRefresh={onRefreshQuote} />

      {/* Price Impact Indicator */}
      {quote && (
        <PriceImpactIndicator
          priceImpact={quote.priceImpact}
          isConfirmed={isImpactConfirmed}
          onConfirmChange={setIsImpactConfirmed}
        />
      )}

      {/* Route Visualizer */}
      {quote && <RouteVisualizer routes={quote.routes} splits={quote.splits} />}

      {/* Pre-flight Simulation Status */}
      <SimulationStatus
        state={simulationState}
        estimatedUnits={quote?.namespace === 'solana' ? 'CU: ~194,200' : 'Gas: ~148,500'}
      />

      {/* Swap Button */}
      <button
        onClick={onExecuteSwap}
        disabled={isLoading || isExecutionBlocked || !quote}
        style={{
          width: '100%',
          marginTop: '16px',
          padding: '16px',
          borderRadius: '14px',
          border: 'none',
          background: isExecutionBlocked
            ? '#ef4444'
            : !quote
            ? '#1e293b'
            : 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          color: !quote ? '#64748b' : '#ffffff',
          fontSize: '15px',
          fontWeight: 700,
          cursor: isExecutionBlocked || !quote ? 'not-allowed' : 'pointer',
          boxShadow: quote && !isExecutionBlocked ? '0 8px 24px rgba(6, 182, 212, 0.3)' : 'none',
          transition: 'all 0.2s ease',
        }}
      >
        {isExecutionBlocked
          ? 'Confirm High Price Impact to Proceed'
          : isLoading
          ? 'Fetching Optimal Route...'
          : !quote
          ? 'Enter Amount'
          : 'Execute Swap'}
      </button>

      {/* Slippage Settings Modal */}
      <SlippageModal
        isOpen={isSlippageOpen}
        currentSlippageBps={slippageBps}
        onClose={() => setIsSlippageOpen(false)}
        onSave={setSlippageBps}
      />
    </div>
  );
};
