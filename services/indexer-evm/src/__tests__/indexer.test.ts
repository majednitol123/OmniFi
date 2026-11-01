import { InMemoryDatabaseClient } from '@omnifi/database';
import { encodeEventTopics, Hex, parseAbiItem } from 'viem';
import { describe, expect, it } from 'vitest';
import { CLMM_SWAP_ABI_ITEM, EvmEventDecoder, V2_SWAP_ABI_ITEM } from '../event-decoder';
import { EvmScanner } from '../scanner';
import { RawLog } from '../types';

describe('EVM Event Indexer & Reorg Recovery (Track P11-B)', () => {
  const dummyPool: `0x${string}` = '0x1111111111111111111111111111111111111111';
  const dummySender: `0x${string}` = '0x2222222222222222222222222222222222222222';
  const dummyRecipient: `0x${string}` = '0x3333333333333333333333333333333333333333';

  it('decodes V2 swap event logs into typed swap structure', () => {
    const decoder = new EvmEventDecoder();

    // V2 Swap: Swap(address indexed sender, uint amount0In, uint amount1In, uint amount0Out, uint amount1Out, address indexed to)
    const topics = encodeEventTopics({
      abi: [V2_SWAP_ABI_ITEM],
      eventName: 'Swap',
      args: {
        sender: dummySender,
        to: dummyRecipient,
      },
    }) as Hex[];

    // Encode data: (uint256, uint256, uint256, uint256) -> amount0In: 1000, amount1In: 0, amount0Out: 0, amount1Out: 500
    const rawData =
      '0x' +
      '00000000000000000000000000000000000000000000000000000000000003e8' + // 1000
      '0000000000000000000000000000000000000000000000000000000000000000' + // 0
      '0000000000000000000000000000000000000000000000000000000000000000' + // 0
      '00000000000000000000000000000000000000000000000000000000000001f4'; // 500

    const log: RawLog = {
      address: dummyPool,
      topics,
      data: rawData as Hex,
      blockNumber: 1000n,
      blockHash: '0xblock1000' as Hex,
      transactionHash: '0xtx1' as Hex,
      logIndex: 0,
    };

    const decoded = decoder.decodeLog(log);
    expect(decoded).toBeDefined();
    expect(decoded?.type).toBe('V2_SWAP');
    if (decoded?.type === 'V2_SWAP') {
      expect(decoded.amount0In).toBe(1000n);
      expect(decoded.amount1Out).toBe(500n);
      expect(decoded.sender.toLowerCase()).toBe(dummySender.toLowerCase());
      expect(decoded.recipient.toLowerCase()).toBe(dummyRecipient.toLowerCase());
    }
  });

  it('scans logs idempotently and recovers from 3-block chain reorg', async () => {
    const db = new InMemoryDatabaseClient();
    const networkId = 'eip155:1';

    await db.insertNetwork({
      networkId,
      name: 'Ethereum Mainnet',
      namespace: 'eip155',
      chainRef: '1',
      nativeAssetSymbol: 'ETH',
      nativeAssetDecimals: 18,
      status: 'active',
      createdAt: new Date(),
    });

    const scanner = new EvmScanner(
      {
        networkId,
        chainId: 1,
        rpcUrl: 'http://127.0.0.1:8545',
      },
      db,
    );

    // Register canonical blocks 100, 101, 102
    scanner.registerBlockHash(100n, '0xhash100' as Hex);
    scanner.registerBlockHash(101n, '0xhash101' as Hex);
    scanner.registerBlockHash(102n, '0xhash102' as Hex);

    const topics = encodeEventTopics({
      abi: [V2_SWAP_ABI_ITEM],
      eventName: 'Swap',
      args: { sender: dummySender, to: dummyRecipient },
    }) as Hex[];

    const rawData =
      '0x' +
      '00000000000000000000000000000000000000000000000000000000000003e8' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '0000000000000000000000000000000000000000000000000000000000000000' +
      '00000000000000000000000000000000000000000000000000000000000001f4';

    const log101: RawLog = {
      address: dummyPool,
      topics,
      data: rawData as Hex,
      blockNumber: 101n,
      blockHash: '0xhash101' as Hex,
      transactionHash: '0xtx101' as Hex,
      logIndex: 0,
    };

    const log102: RawLog = {
      address: dummyPool,
      topics,
      data: rawData as Hex,
      blockNumber: 102n,
      blockHash: '0xhash102' as Hex,
      transactionHash: '0xtx102' as Hex,
      logIndex: 0,
    };

    // Process logs: block 100 is finalized, 101 & 102 are unfinalized
    await scanner.processLogs([log101, log102], 100n);

    let swaps = await db.listSwapsByPool(dummyPool.toLowerCase());
    expect(swaps.length).toBe(2);

    // Test Idempotency: Processing identical logs again does not create duplicate entries
    await scanner.processLogs([log101, log102], 100n);
    swaps = await db.listSwapsByPool(dummyPool.toLowerCase());
    expect(swaps.length).toBe(2);

    // Now simulate reorg at block 102: New block 102 reports parentHash != known 101 hash (reorged back to 100)
    const forkDetectedAncestor = scanner.detectReorg(102n, '0xdivergentParentHash' as Hex);
    expect(forkDetectedAncestor).toBeDefined();

    if (forkDetectedAncestor !== undefined) {
      const rolledBack = await scanner.handleReorg(102n, forkDetectedAncestor);
      expect(rolledBack).toBeGreaterThan(0);
    }

    // Verify unfinalized events on orphaned chain were purged
    swaps = await db.listSwapsByPool(dummyPool.toLowerCase());
    expect(swaps.length).toBe(0); // All unfinalized events past ancestor were cleanly rolled back
  });
});

