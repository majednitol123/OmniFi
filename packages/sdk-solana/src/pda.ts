import { PublicKey } from '@solana/web3.js';
import {
  GLOBAL_CONFIG_SEED,
  LP_MINT_SEED,
  OMNIFI_AMM_PROGRAM_ID,
  POOL_AUTHORITY_SEED,
  POOL_STATE_SEED,
} from './constants';

/**
 * Sorts two mint addresses canonically (lexicographical comparison).
 */
export function sortMints(mintA: PublicKey, mintB: PublicKey): [PublicKey, PublicKey] {
  if (mintA.equals(mintB)) {
    throw new Error('Identical token mints provided');
  }

  const cmp = mintA.toBuffer().compare(mintB.toBuffer());
  if (cmp < 0) return [mintA, mintB];
  if (cmp > 0) return [mintB, mintA];

  throw new Error('Identical token mints provided');
}

/**
 * Derives the GlobalConfig PDA.
 */
export function deriveGlobalConfigAddress(
  programId: PublicKey = OMNIFI_AMM_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([GLOBAL_CONFIG_SEED], programId);
}

/**
 * Derives the PoolState PDA for a token pair and fee tier.
 */
export function derivePoolAddress(
  mint0: PublicKey,
  mint1: PublicKey,
  feeTier: number,
  programId: PublicKey = OMNIFI_AMM_PROGRAM_ID,
): [PublicKey, number] {
  const feeTierBuffer = Buffer.alloc(4);
  feeTierBuffer.writeUInt32LE(feeTier, 0);

  return PublicKey.findProgramAddressSync(
    [POOL_STATE_SEED, mint0.toBuffer(), mint1.toBuffer(), feeTierBuffer],
    programId,
  );
}

/**
 * Derives the off-curve Pool Authority PDA used to sign CPIs and own vaults.
 */
export function derivePoolAuthorityAddress(
  poolState: PublicKey,
  programId: PublicKey = OMNIFI_AMM_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([POOL_AUTHORITY_SEED, poolState.toBuffer()], programId);
}

/**
 * Derives the LP Token Mint PDA for a given pool.
 */
export function deriveLpMintAddress(
  poolState: PublicKey,
  programId: PublicKey = OMNIFI_AMM_PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([LP_MINT_SEED, poolState.toBuffer()], programId);
}
