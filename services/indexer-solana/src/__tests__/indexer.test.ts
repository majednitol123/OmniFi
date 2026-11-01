import { InMemoryDatabaseClient } from '@omnifi/database';
import { PublicKey } from '@solana/web3.js';
import { describe, expect, it } from 'vitest';
import { SolanaScanner } from '../scanner';
import { SolanaRawTransaction } from '../types';

describe('Solana Transaction & Account Indexer (Track P11-C)', () => {
  const dummyAmmProgram = new PublicKey('Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3');
  const dummyClmmProgram = new PublicKey('BSn4qU6Reocr7apUznvRkXLQ4psydsrayW9YWyToD6x2');
  const networkId = 'solana:mainnet-beta';

  it('scans and decodes AMM and CLMM transactions with idempotency', async () => {
    const db = new InMemoryDatabaseClient();
    await db.insertNetwork({
      networkId,
      name: 'Solana Mainnet',
      namespace: 'solana',
      chainRef: 'mainnet-beta',
      nativeAssetSymbol: 'SOL',
      nativeAssetDecimals: 9,
      status: 'active',
      createdAt: new Date(),
    });

    const scanner = new SolanaScanner(
      {
        networkId,
        cluster: 'mainnet-beta',
        rpcUrl: 'http://127.0.0.1:8899',
        ammProgramId: dummyAmmProgram,
        clmmProgramId: dummyClmmProgram,
      },
      db,
    );

    const dummyPool = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
    const dummyUser = 'So11111111111111111111111111111111111111112';

    const rawTx1: SolanaRawTransaction = {
      signature: '5K3dTx1234567890abcdef',
      slot: 250000000n,
      blockTime: Math.floor(Date.now() / 1000),
      err: null,
      accounts: [dummyUser, dummyPool],
      logs: [
        'Program Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3 invoke [1]',
        'Program log: Instruction: SwapExactInput',
        'Program Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3 success',
      ],
    };

    // 1. Process AMM Swap
    const count = await scanner.processTransactions([rawTx1], false);
    expect(count).toBe(1);

    let swaps = await db.listSwapsByPool(dummyPool);
    expect(swaps.length).toBe(1);
    expect(swaps[0]?.amount0In).toBe(1_000_000n);
    expect(swaps[0]?.finalized).toBe(false);

    // 2. Process same transaction again (Idempotency test)
    await scanner.processTransactions([rawTx1], false);
    swaps = await db.listSwapsByPool(dummyPool);
    expect(swaps.length).toBe(1); // No duplicates

    // 3. Process CLMM position update
    const dummyPosition = 'Pos1111111111111111111111111111111111111111';
    const rawTx2: SolanaRawTransaction = {
      signature: '5K3dTx9876543210clmm',
      slot: 250000010n,
      blockTime: Math.floor(Date.now() / 1000),
      err: null,
      accounts: [dummyPool, dummyPosition, dummyUser],
      logs: [
        'Program BSn4qU6Reocr7apUznvRkXLQ4psydsrayW9YWyToD6x2 invoke [1]',
        'Program log: Instruction: OpenPosition',
        'Program BSn4qU6Reocr7apUznvRkXLQ4psydsrayW9YWyToD6x2 success',
      ],
    };

    await scanner.processTransactions([rawTx2], true);
    const pos = await db.getPositionByOnchain(networkId, dummyPosition);
    expect(pos).toBeDefined();
    expect(pos?.owner).toBe(dummyUser);
    expect(pos?.liquidity).toBe(100_000_000n);

    // Verify Checkpoint updated to 250000010
    const cp = await db.getCheckpoint(networkId);
    expect(cp?.lastScannedBlockOrSlot).toBe(250000010n);
    expect(cp?.lastFinalizedBlockOrSlot).toBe(250000010n);
  });
});

