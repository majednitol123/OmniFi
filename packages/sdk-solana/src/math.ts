import { FEE_DENOMINATOR, MINIMUM_LIQUIDITY } from './constants';
import { SwapQuoteParams, SwapQuoteResult } from './types';

/**
 * Integer square root using Babylonian method.
 */
export function sqrt(y: bigint): bigint {
  if (y > 3n) {
    let z = y;
    let x = y / 2n + 1n;
    while (x < z) {
      z = x;
      x = (y / x + x) / 2n;
    }
    return z;
  } else if (y !== 0n) {
    return 1n;
  }
  return 0n;
}

export function mulDivDown(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) throw new Error('Division by zero');
  return (a * b) / c;
}

export function mulDivUp(a: bigint, b: bigint, c: bigint): bigint {
  if (c === 0n) throw new Error('Division by zero');
  const prod = a * b;
  if (prod === 0n) return 0n;
  return (prod - 1n) / c + 1n;
}

/**
 * Quotes exact input swap output and fee breakdown.
 */
export function quoteExactInput(params: SwapQuoteParams): SwapQuoteResult {
  const { amountIn, reserveIn, reserveOut, feeTier, protocolFeeFraction = 0 } = params;
  if (!amountIn || amountIn <= 0n) throw new Error('Invalid input amount');
  if (reserveIn <= 0n || reserveOut <= 0n) throw new Error('Insufficient pool liquidity');

  const feeAmount = mulDivUp(amountIn, BigInt(feeTier), FEE_DENOMINATOR);
  const amountInAfterFee = amountIn - feeAmount;

  const numerator = reserveOut * amountInAfterFee;
  const denominator = reserveIn + amountInAfterFee;
  const amountOut = numerator / denominator;

  const protocolFeeAmount =
    protocolFeeFraction > 0
      ? mulDivDown(feeAmount, BigInt(protocolFeeFraction), FEE_DENOMINATOR)
      : 0n;

  // Price impact in basis points (1 bp = 0.01% = 1e-4)
  // idealOutput = amountIn * reserveOut / reserveIn
  const idealOutput = (amountIn * reserveOut) / reserveIn;
  const priceImpactBps =
    idealOutput > 0n
      ? Number(((idealOutput - amountOut) * 10000n) / idealOutput)
      : 0;

  return {
    amountIn,
    amountOut,
    feeAmount,
    protocolFeeAmount,
    priceImpactBps,
  };
}

/**
 * Quotes required input for an exact output swap.
 */
export function quoteExactOutput(params: SwapQuoteParams): SwapQuoteResult {
  const { amountOut, reserveIn, reserveOut, feeTier, protocolFeeFraction = 0 } = params;
  if (!amountOut || amountOut <= 0n) throw new Error('Invalid output amount');
  if (amountOut >= reserveOut) throw new Error('Amount out exceeds pool reserves');

  const numerator = reserveIn * amountOut;
  const denominator = reserveOut - amountOut;
  const amountInAfterFee = (numerator - 1n) / denominator + 1n;

  const feeMultiplier = FEE_DENOMINATOR - BigInt(feeTier);
  const amountIn = mulDivUp(amountInAfterFee, FEE_DENOMINATOR, feeMultiplier);
  const feeAmount = amountIn - amountInAfterFee;

  const protocolFeeAmount =
    protocolFeeFraction > 0
      ? mulDivDown(feeAmount, BigInt(protocolFeeFraction), FEE_DENOMINATOR)
      : 0n;

  const idealOutput = (amountIn * reserveOut) / reserveIn;
  const priceImpactBps =
    idealOutput > 0n
      ? Number(((idealOutput - amountOut) * 10000n) / idealOutput)
      : 0;

  return {
    amountIn,
    amountOut,
    feeAmount,
    protocolFeeAmount,
    priceImpactBps,
  };
}

/**
 * Calculates liquidity shares minted for a deposit.
 */
export function quoteAddLiquidity(
  amount0Desired: bigint,
  amount1Desired: bigint,
  reserve0: bigint,
  reserve1: bigint,
  lpSupply: bigint,
): { amount0: bigint; amount1: bigint; liquidity: bigint } {
  if (lpSupply === 0n) {
    const initialLiquidity = sqrt(amount0Desired * amount1Desired);
    if (initialLiquidity <= MINIMUM_LIQUIDITY) {
      throw new Error('Initial liquidity below minimum locked amount');
    }
    return {
      amount0: amount0Desired,
      amount1: amount1Desired,
      liquidity: initialLiquidity - MINIMUM_LIQUIDITY,
    };
  }

  const amount1Optimal = mulDivDown(amount0Desired, reserve1, reserve0);
  if (amount1Optimal <= amount1Desired) {
    const liquidity0 = mulDivDown(amount0Desired, lpSupply, reserve0);
    const liquidity1 = mulDivDown(amount1Optimal, lpSupply, reserve1);
    const liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
    return {
      amount0: amount0Desired,
      amount1: amount1Optimal,
      liquidity,
    };
  } else {
    const amount0Optimal = mulDivDown(amount1Desired, reserve0, reserve1);
    const liquidity0 = mulDivDown(amount0Optimal, lpSupply, reserve0);
    const liquidity1 = mulDivDown(amount1Desired, lpSupply, reserve1);
    const liquidity = liquidity0 < liquidity1 ? liquidity0 : liquidity1;
    return {
      amount0: amount0Optimal,
      amount1: amount1Desired,
      liquidity,
    };
  }
}
