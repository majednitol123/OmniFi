import { Route, RouteSplit } from '@omnifi/domain';
import React from 'react';

export interface RouteVisualizerProps {
  routes: Route[];
  splits?: RouteSplit[] | undefined;
}

export const RouteVisualizer: React.FC<RouteVisualizerProps> = ({ routes, splits }) => {
  if (routes.length === 0) {
    return null;
  }

  const formatFee = (feeTier: number) => {
    return `${(feeTier / 10000).toFixed(2)}%`;
  };

  return (
    <div
      style={{
        background: 'rgba(15, 23, 42, 0.6)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '14px',
        padding: '16px',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        marginTop: '12px',
      }}
    >
      <div
        style={{
          fontSize: '12px',
          fontWeight: 600,
          color: '#94a3b8',
          textTransform: 'uppercase',
          letterSpacing: '0.05em',
          marginBottom: '12px',
        }}
      >
        Execution Route Graph
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {routes.map((route, routeIdx) => {
          const split = splits?.find((s) => s.routeIndex === routeIdx);
          const splitPercentage = split ? split.percentage : 100;

          return (
            <div
              key={route.routeId}
              style={{
                display: 'flex',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '8px',
                padding: '10px 12px',
                background: 'rgba(30, 41, 59, 0.4)',
                borderRadius: '8px',
                border: '1px solid rgba(255, 255, 255, 0.04)',
                fontSize: '12px',
              }}
            >
              {/* Split allocation badge */}
              {splits && splits.length > 1 && (
                <span
                  style={{
                    background: 'rgba(6, 182, 212, 0.15)',
                    color: '#22d3ee',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontWeight: 600,
                    fontSize: '11px',
                  }}
                >
                  {splitPercentage}%
                </span>
              )}

              {/* Hop-by-hop traversal display */}
              {route.hops.map((hop, hopIdx) => (
                <React.Fragment key={`${route.routeId}-hop-${hopIdx}`}>
                  {hopIdx === 0 && (
                    <span
                      style={{
                        color: '#f8fafc',
                        fontWeight: 600,
                        fontFamily: 'monospace',
                        background: 'rgba(255, 255, 255, 0.05)',
                        padding: '3px 8px',
                        borderRadius: '6px',
                      }}
                    >
                      {hop.tokenIn.address.substring(0, 6)}...
                    </span>
                  )}

                  <span style={{ color: '#64748b' }}>➔</span>

                  {/* Pool Badge */}
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px',
                      background: 'rgba(56, 189, 248, 0.1)',
                      border: '1px solid rgba(56, 189, 248, 0.25)',
                      padding: '2px 8px',
                      borderRadius: '6px',
                      color: '#7dd3fc',
                      fontSize: '11px',
                    }}
                  >
                    <span style={{ fontWeight: 600 }}>{hop.pool.poolType.toUpperCase()}</span>
                    <span style={{ color: '#94a3b8' }}>•</span>
                    <span>{formatFee(hop.feeTier)}</span>
                  </div>

                  <span style={{ color: '#64748b' }}>➔</span>

                  <span
                    style={{
                      color: '#f8fafc',
                      fontWeight: 600,
                      fontFamily: 'monospace',
                      background: 'rgba(255, 255, 255, 0.05)',
                      padding: '3px 8px',
                      borderRadius: '6px',
                    }}
                  >
                    {hop.tokenOut.address.substring(0, 6)}...
                  </span>
                </React.Fragment>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};
