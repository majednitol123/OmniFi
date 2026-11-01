import { describe, it, expect, beforeEach } from 'vitest';
import {
  getTransactionHistory,
  saveTransactionToHistory,
  clearTransactionHistory,
  getExplorerUrl,
  RecordedTransaction,
} from '../lib/tx-executor';

describe('Wallet and Transaction Recording System', () => {
  beforeEach(() => {
    clearTransactionHistory();
  });

  it('determines correct block explorer URLs per network', () => {
    const ethTx = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
    expect(getExplorerUrl('eip155:1', ethTx)).toBe(`https://etherscan.io/tx/${ethTx}`);
    expect(getExplorerUrl('eip155:8453', ethTx)).toBe(`https://basescan.org/tx/${ethTx}`);

    const solTx = '5abc123';
    expect(getExplorerUrl('solana:mainnet-beta', solTx)).toBe(`https://solscan.io/tx/${solTx}`);
  });

  it('saves and retrieves transactions with lifecycle states', () => {
    const tx: RecordedTransaction = {
      id: 'tx-1',
      txHash: '0xabc',
      namespace: 'eip155',
      networkId: 'eip155:1',
      userAddress: '0x1111111111111111111111111111111111111111',
      actionType: 'swap',
      summary: 'Swap 100 USDC -> WETH',
      status: 'submitted',
      timestamp: Date.now(),
      explorerUrl: 'https://etherscan.io/tx/0xabc',
    };

    saveTransactionToHistory(tx);
    const history = getTransactionHistory();
    expect(history.length).toBe(1);
    expect(history[0]?.status).toBe('submitted');

    // Update status to confirmed
    const updatedTx: RecordedTransaction = {
      ...tx,
      status: 'confirmed',
    };
    saveTransactionToHistory(updatedTx);
    const updatedHistory = getTransactionHistory();
    expect(updatedHistory.length).toBe(1);
    expect(updatedHistory[0]?.status).toBe('confirmed');
  });
});
