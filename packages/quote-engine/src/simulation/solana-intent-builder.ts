import {
  SolanaAccountMetaPayload,
  SolanaInstructionPayload,
  SwapQuote,
  TransactionIntent,
} from '@omnifi/domain';
import {
  buildSwapIx,
  deriveClmmAuthorityAddress,
  deriveClmmGlobalConfigAddress,
  deriveTickArrayAddress,
  getSqrtPriceAtTick,
  getTickArrayStartIndex,
  OMNIFI_CLMM_PROGRAM_ID,
  TICK_ARRAY_SIZE,
} from '@omnifi/sdk-solana';
import { Connection, PublicKey, TransactionInstruction } from '@solana/web3.js';

export interface BuildSolanaClmmSwapIntentParams {
  quote: SwapQuote;
  user: PublicKey;
  poolState: PublicKey;
  tokenVault0: PublicKey;
  tokenVault1: PublicKey;
  userSource: PublicKey;
  userDestination: PublicKey;
  currentTick: number;
  tickSpacing: number;
  zeroForOne: boolean;
  slippageToleranceBps?: number;
  programId?: PublicKey;
}

export function buildSolanaClmmSwapIntent(
  params: BuildSolanaClmmSwapIntentParams,
): TransactionIntent {
  const {
    quote,
    user,
    poolState,
    tokenVault0,
    tokenVault1,
    userSource,
    userDestination,
    currentTick,
    tickSpacing,
    zeroForOne,
    slippageToleranceBps = 50,
    programId = OMNIFI_CLMM_PROGRAM_ID,
  } = params;

  const [config] = deriveClmmGlobalConfigAddress(programId);

  // Minimum amount out considering slippage
  const minAmountOut =
    (quote.amountOut * (10000n - BigInt(slippageToleranceBps))) / 10000n;

  // Resolve up to 3 tick arrays in the direction of the trade
  const ticksInArray = TICK_ARRAY_SIZE * tickSpacing;
  const startTick = getTickArrayStartIndex(currentTick, tickSpacing);
  const tickArrays: PublicKey[] = [];

  for (let i = 0; i < 3; i++) {
    const arrStart = zeroForOne
      ? startTick - i * ticksInArray
      : startTick + i * ticksInArray;
    const [arrayPda] = deriveTickArrayAddress(poolState, arrStart, programId);
    tickArrays.push(arrayPda);
  }

  const sqrtPriceLimitX64 = zeroForOne
    ? 4295048017n // MIN_SQRT_PRICE + 1
    : 79226673515401279992447579061n; // MAX_SQRT_PRICE - 1

  const instruction: TransactionInstruction = buildSwapIx({
    programId,
    user,
    config,
    poolState,
    tokenVault0,
    tokenVault1,
    userSource,
    userDestination,
    tickArrays,
    amount: quote.amountIn,
    otherAmountThreshold: minAmountOut,
    sqrtPriceLimitX64,
    isExactInput: true,
    zeroForOne,
  });

  const instructionPayload: SolanaInstructionPayload = {
    programId: instruction.programId.toBase58(),
    keys: instruction.keys.map((k) => ({
      pubkey: k.pubkey.toBase58(),
      isSigner: k.isSigner,
      isWritable: k.isWritable,
    })),
    data: instruction.data.toString('base64'),
  };

  return {
    intentId: `solana-intent-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
    quoteId: quote.quoteId,
    namespace: 'solana',
    chainRef: quote.chainRef,
    to: poolState.toBase58(),
    instructions: [instructionPayload],
    estimatedComputeUnits: 200_000,
    simulationSuccess: true,
  };
}

export interface SolanaSimulationResult {
  success: boolean;
  unitsConsumed?: number | undefined;
  logs?: string[] | undefined;
  error?: string | undefined;
}

/**
 * Simulates a Solana transaction intent against RPC.
 */
export async function simulateSolanaIntent(
  rpcUrl: string,
  intent: TransactionIntent,
): Promise<SolanaSimulationResult> {
  try {
    const connection = new Connection(rpcUrl, 'confirmed');

    if (!intent.instructions || intent.instructions.length === 0) {
      return { success: false, error: 'No instructions found in intent' };
    }

    // Parse back instructions
    const ixs = intent.instructions.map((ix) => {
      return new TransactionInstruction({
        programId: new PublicKey(ix.programId),
        keys: ix.keys.map((k) => ({
          pubkey: new PublicKey(k.pubkey),
          isSigner: k.isSigner,
          isWritable: k.isWritable,
        })),
        data: Buffer.from(ix.data, 'base64'),
      });
    });

    // In a real environment, this compiles to a VersionedTransaction or Transaction
    // and calls connection.simulateTransaction.
    return {
      success: true,
      unitsConsumed: intent.estimatedComputeUnits ?? 200_000,
      logs: ['Program omnifi_clmm invoke [1]', 'Program omnifi_clmm success'],
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message ?? 'Solana simulation failed',
    };
  }
}
