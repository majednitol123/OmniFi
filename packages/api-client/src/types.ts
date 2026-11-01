import { ErrorCode, ApiError } from './errors';

export interface HealthResponse {
  readonly status: 'ok' | 'degraded' | 'maintenance';
  readonly timestamp: string;
  readonly version: string;
}

export interface NetworkSummary {
  readonly id: string;
  readonly displayName: string;
  readonly namespace: 'eip155' | 'solana';
  readonly chainRef: string;
  readonly isTestnet: boolean;
}

export interface TokenResponse {
  readonly assetRef: string;
  readonly name: string;
  readonly symbol: string;
  readonly decimals: number;
  readonly riskTier: 'verified' | 'unverified' | 'blocked';
  readonly logoUri?: string | undefined;
  readonly blockReason?: string | undefined;
}

export interface QuoteRequest {
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly amount: string; // Decimal integer string
  readonly exactIn: boolean;
}

export interface QuoteResponse {
  readonly tokenIn: string;
  readonly tokenOut: string;
  readonly amountIn: string; // Decimal integer string
  readonly amountOut: string; // Decimal integer string
  readonly executionPrice: string;
  readonly priceImpactBps: number;
  readonly estimatedGasOrFee: string;
}

export { ErrorCode, ApiError };

