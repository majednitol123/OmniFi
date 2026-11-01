import { describe, it, expect } from 'vitest';

describe('Trading Math & Non-Custodial Bounds', () => {
  it('accurately computes slippage tolerance in basis points with integer math', () => {
    const amountOut = 1_000_000_000n; // 1000 USDC (6 decimals)
    const slippageBps = 50; // 0.50%

    // minAmountOut = amountOut * (10000 - slippageBps) / 10000
    const minAmountOut = (amountOut * BigInt(10000 - slippageBps)) / 10000n;

    expect(minAmountOut).toBe(995_000_000n); // exactly 995 USDC
  });

  it('accurately evaluates high price impact thresholds without floating point precision issues', () => {
    const evaluatesImpact = (priceImpactBps: number) => {
      const isHighImpact = priceImpactBps >= 100; // >= 1%
      const isCriticalImpact = priceImpactBps >= 500; // >= 5%
      return { isHighImpact, isCriticalImpact };
    };

    expect(evaluatesImpact(15)).toEqual({ isHighImpact: false, isCriticalImpact: false });
    expect(evaluatesImpact(100)).toEqual({ isHighImpact: true, isCriticalImpact: false });
    expect(evaluatesImpact(250)).toEqual({ isHighImpact: true, isCriticalImpact: false });
    expect(evaluatesImpact(500)).toEqual({ isHighImpact: true, isCriticalImpact: true });
    expect(evaluatesImpact(1250)).toEqual({ isHighImpact: true, isCriticalImpact: true });
  });

  it('safely converts decimal integer strings to raw units', () => {
    const parseAmount = (input: string, decimals: number): bigint => {
      const parts = input.split('.');
      const whole = BigInt(parts[0] || '0') * 10n ** BigInt(decimals);
      if (parts.length > 1 && parts[1]) {
        const fracStr = parts[1].slice(0, decimals).padEnd(decimals, '0');
        return whole + BigInt(fracStr);
      }
      return whole;
    };

    expect(parseAmount('100', 6)).toBe(100_000_000n);
    expect(parseAmount('1.5', 6)).toBe(1_500_000n);
    expect(parseAmount('0.000001', 6)).toBe(1n);
    expect(parseAmount('2.5', 18)).toBe(2_500_000_000_000_000_000n);
  });
});
