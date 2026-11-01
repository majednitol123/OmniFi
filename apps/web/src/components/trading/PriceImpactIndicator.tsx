import { PriceImpact } from '@omnifi/domain';
import React from 'react';

export interface PriceImpactIndicatorProps {
  priceImpact: PriceImpact;
  isConfirmed?: boolean | undefined;
  onConfirmChange?: ((confirmed: boolean) => void) | undefined;
}

export const PriceImpactIndicator: React.FC<PriceImpactIndicatorProps> = ({
  priceImpact,
  isConfirmed = false,
  onConfirmChange,
}) => {
  const isHigh = priceImpact.level === 'high' || priceImpact.level === 'critical';
  const isMedium = priceImpact.level === 'medium';

  let color = '#10b981'; // Emerald
  let bg = 'rgba(16, 185, 129, 0.1)';
  let borderColor = 'rgba(16, 185, 129, 0.25)';

  if (isMedium) {
    color = '#f59e0b'; // Amber
    bg = 'rgba(245, 158, 11, 0.1)';
    borderColor = 'rgba(245, 158, 11, 0.25)';
  } else if (isHigh) {
    color = '#ef4444'; // Crimson
    bg = 'rgba(239, 68, 68, 0.1)';
    borderColor = 'rgba(239, 68, 68, 0.3)';
  }

  return (
    <div style={{ marginTop: '12px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 12px',
          background: bg,
          border: `1px solid ${borderColor}`,
          borderRadius: '8px',
          fontSize: '12px',
        }}
      >
        <span style={{ color: '#94a3b8' }}>Price Impact:</span>
        <span
          style={{
            fontFamily: 'monospace',
            fontWeight: 700,
            color,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          {isHigh && '⚠️'} {priceImpact.percentage} ({priceImpact.level.toUpperCase()})
        </span>
      </div>

      {/* Mandatory confirmation checkbox for High/Critical impact */}
      {isHigh && onConfirmChange && (
        <div
          style={{
            marginTop: '8px',
            padding: '10px 12px',
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#fca5a5',
            display: 'flex',
            alignItems: 'flex-start',
            gap: '8px',
          }}
        >
          <input
            type="checkbox"
            id="price-impact-confirm"
            checked={isConfirmed}
            onChange={(e) => onConfirmChange(e.target.checked)}
            style={{ marginTop: '2px', cursor: 'pointer' }}
          />
          <label htmlFor="price-impact-confirm" style={{ cursor: 'pointer', lineHeight: '1.4' }}>
            <strong>High Price Impact Warning:</strong> This swap will lose approximately{' '}
            {priceImpact.percentage} of its value to market impact. Check here to confirm you understand the risks.
          </label>
        </div>
      )}
    </div>
  );
};
