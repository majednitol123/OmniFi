import { PublicKey } from '@solana/web3.js';
import { FeeTier } from './constants';

export interface GlobalConfigAccount {
  authority: PublicKey;
  feeAuthority: PublicKey;
  protocolFeeFraction: number;
  emergencyPaused: boolean;
  bump: number;
}

export interface PoolStateAccount {
  config: PublicKey;
  tokenMint0: PublicKey;
  tokenMint1: PublicKey;
  tokenVault0: PublicKey;
  tokenVault1: PublicKey;
  lpMint: PublicKey;
  feeTier: FeeTier;
  reserve0: bigint;
  reserve1: bigint;
  lpSupply: bigint;
  protocolFees0: bigint;
  protocolFees1: bigint;
  bump: number;
  authorityBump: number;
  isPaused: boolean;
}

export interface SwapQuoteParams {
  amountIn?: bigint;
  amountOut?: bigint;
  reserveIn: bigint;
  reserveOut: bigint;
  feeTier: number;
  protocolFeeFraction?: number;
}

export interface SwapQuoteResult {
  amountIn: bigint;
  amountOut: bigint;
  feeAmount: bigint;
  protocolFeeAmount: bigint;
  priceImpactBps: number;
}
