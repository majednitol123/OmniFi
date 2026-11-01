import React, { useState } from 'react';

export interface SlippageModalProps {
  isOpen: boolean;
  currentSlippageBps: number;
  onClose: () => void;
  onSave: (bps: number) => void;
}

const PRESETS = [
  { label: '0.1%', bps: 10 },
  { label: '0.5%', bps: 50 },
  { label: '1.0%', bps: 100 },
];

export const SlippageModal: React.FC<SlippageModalProps> = ({
  isOpen,
  currentSlippageBps,
  onClose,
  onSave,
}) => {
  const [selectedBps, setSelectedBps] = useState(currentSlippageBps);
  const [customValue, setCustomValue] = useState(
    PRESETS.some((p) => p.bps === currentSlippageBps)
      ? ''
      : (currentSlippageBps / 100).toString(),
  );

  if (!isOpen) return null;

  const handlePreset = (bps: number) => {
    setSelectedBps(bps);
    setCustomValue('');
  };

  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setCustomValue(val);
    const num = parseFloat(val);
    if (!isNaN(num) && num >= 0) {
      setSelectedBps(Math.round(num * 100));
    }
  };

  const isWarning = selectedBps > 500; // > 5.0%
  const isBlocked = selectedBps > 5000; // > 50.0% (anti-fat-finger)
  const isZero = selectedBps <= 0;

  const handleSave = () => {
    if (isBlocked || isZero) return;
    onSave(selectedBps);
    onClose();
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      <div
        style={{
          background: '#0f172a',
          border: '1px solid rgba(255, 255, 255, 0.12)',
          borderRadius: '16px',
          padding: '24px',
          width: '360px',
          maxWidth: '90vw',
          color: '#f8fafc',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.5)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '16px',
          }}
        >
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 600 }}>Slippage Tolerance</h3>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
            }}
          >
            ✕
          </button>
        </div>

        <p style={{ fontSize: '12px', color: '#94a3b8', margin: '0 0 16px 0', lineHeight: '1.4' }}>
          Your transaction will revert if the price changes unfavorably by more than this percentage.
        </p>

        {/* Presets and Custom Input */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
          {PRESETS.map((p) => {
            const isSelected = selectedBps === p.bps && !customValue;
            return (
              <button
                key={p.label}
                onClick={() => handlePreset(p.bps)}
                style={{
                  flex: 1,
                  padding: '8px 0',
                  borderRadius: '8px',
                  border: isSelected
                    ? '1px solid #06b6d4'
                    : '1px solid rgba(255, 255, 255, 0.1)',
                  background: isSelected ? 'rgba(6, 182, 212, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                  color: isSelected ? '#38bdf8' : '#e2e8f0',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                }}
              >
                {p.label}
              </button>
            );
          })}

          <div style={{ flex: 1.2, position: 'relative' }}>
            <input
              type="number"
              step="0.1"
              placeholder="Custom"
              value={customValue}
              onChange={handleCustomChange}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '8px 20px 8px 10px',
                borderRadius: '8px',
                border: customValue
                  ? '1px solid #06b6d4'
                  : '1px solid rgba(255, 255, 255, 0.1)',
                background: 'rgba(255, 255, 255, 0.04)',
                color: '#f8fafc',
                fontSize: '13px',
                fontFamily: 'monospace',
                outline: 'none',
              }}
            />
            <span
              style={{
                position: 'absolute',
                right: '8px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#94a3b8',
                fontSize: '12px',
              }}
            >
              %
            </span>
          </div>
        </div>

        {/* Anti-fat-finger Alerts */}
        {isBlocked && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#f87171',
              marginBottom: '16px',
            }}
          >
            ⛔ Slippage cannot exceed 50.00% to prevent devastating front-running and MEV loss.
          </div>
        )}

        {isWarning && !isBlocked && (
          <div
            style={{
              padding: '8px 12px',
              background: 'rgba(245, 158, 11, 0.15)',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#fbbf24',
              marginBottom: '16px',
            }}
          >
            ⚠️ High slippage warning: Trades with &gt;5.0% slippage are vulnerable to sandwich attacks.
          </div>
        )}

        <button
          onClick={handleSave}
          disabled={isBlocked || isZero}
          style={{
            width: '100%',
            padding: '10px 0',
            borderRadius: '10px',
            border: 'none',
            background: isBlocked || isZero ? '#334155' : 'linear-gradient(135deg, #06b6d4, #3b82f6)',
            color: isBlocked || isZero ? '#64748b' : '#ffffff',
            fontWeight: 700,
            fontSize: '14px',
            cursor: isBlocked || isZero ? 'not-allowed' : 'pointer',
          }}
        >
          Confirm Slippage
        </button>
      </div>
    </div>
  );
};
