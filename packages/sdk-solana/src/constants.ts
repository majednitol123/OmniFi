import { PublicKey } from '@solana/web3.js';

export const OMNIFI_AMM_PROGRAM_ID = new PublicKey(
  'Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3',
);

export const GLOBAL_CONFIG_SEED = Buffer.from('omnifi-config');
export const POOL_STATE_SEED = Buffer.from('omnifi-pool');
export const POOL_AUTHORITY_SEED = Buffer.from('omnifi-authority');
export const LP_MINT_SEED = Buffer.from('omnifi-lp-mint');

export const MINIMUM_LIQUIDITY = 1000n;
export const FEE_DENOMINATOR = 1_000_000n;

export const ALLOWED_FEE_TIERS = [100, 500, 3000, 10000] as const;
export type FeeTier = (typeof ALLOWED_FEE_TIERS)[number];

