'use client';

import { SwapQuote } from '@omnifi/domain';
import React, { useState } from 'react';
import { TradingCockpit } from '../components/trading';

const SAMPLE_QUOTE: SwapQuote = {
  quoteId: 'quote-demo-1',
  namespace: 'eip155',
  chainRef: '1',
  tokenIn: {
    namespace: 'eip155',
    chainRef: '1',
    address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
  },
  tokenOut: {
    namespace: 'eip155',
    chainRef: '1',
    address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  },
  amountIn: 10_000_000_000n, // 10,000 USDC
  amountOut: 4_992_450_000_000_000_000n, // ~4.992 WETH
  executionPrice: '0.000499',
  priceImpact: {
    bps: 15,
    percentage: '0.15%',
    level: 'low',
  },
  routes: [
    {
      routeId: 'route-sample-0',
      hops: [
        {
          pool: {
            poolId: 'usdc-weth-v2',
            namespace: 'eip155',
            chainRef: '1',
            poolType: 'v2',
            token0: {
              namespace: 'eip155',
              chainRef: '1',
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            },
            token1: {
              namespace: 'eip155',
              chainRef: '1',
              address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            },
            feeTier: 3000,
            state: {},
          },
          tokenIn: {
            namespace: 'eip155',
            chainRef: '1',
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
          tokenOut: {
            namespace: 'eip155',
            chainRef: '1',
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          },
          feeTier: 3000,
        },
      ],
      amountIn: 5_000_000_000n,
      amountOut: 2_496_500_000_000_000_000n,
      priceImpact: { bps: 14, percentage: '0.14%', level: 'low' },
      feeBreakdowns: [],
    },
    {
      routeId: 'route-sample-1',
      hops: [
        {
          pool: {
            poolId: 'usdc-weth-v3',
            namespace: 'eip155',
            chainRef: '1',
            poolType: 'v3',
            token0: {
              namespace: 'eip155',
              chainRef: '1',
              address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
            },
            token1: {
              namespace: 'eip155',
              chainRef: '1',
              address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
            },
            feeTier: 500,
            state: {},
          },
          tokenIn: {
            namespace: 'eip155',
            chainRef: '1',
            address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          },
          tokenOut: {
            namespace: 'eip155',
            chainRef: '1',
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          },
          feeTier: 500,
        },
      ],
      amountIn: 5_000_000_000n,
      amountOut: 2_495_950_000_000_000_000n,
      priceImpact: { bps: 16, percentage: '0.16%', level: 'low' },
      feeBreakdowns: [],
    },
  ],
  splits: [
    {
      routeIndex: 0,
      percentage: 50,
      amountIn: 5_000_000_000n,
      amountOut: 2_496_500_000_000_000_000n,
    },
    {
      routeIndex: 1,
      percentage: 50,
      amountIn: 5_000_000_000n,
      amountOut: 2_495_950_000_000_000_000n,
    },
  ],
  expiresAt: Date.now() + 15000,
  ttlMs: 15000,
};

export default function HomePage() {
  const [quote, setQuote] = useState<SwapQuote | null>(SAMPLE_QUOTE);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#030712',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '32px 16px',
      }}
    >
      <TradingCockpit
        quote={quote}
        onRefreshQuote={() => {
          if (quote) {
            setQuote({
              ...quote,
              expiresAt: Date.now() + 15000,
            });
          }
        }}
      />
    </main>
  );
}
