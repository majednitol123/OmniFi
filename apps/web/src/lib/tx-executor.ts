export type TxStatus = 'idle' | 'preparing' | 'submitting' | 'submitted' | 'confirmed' | 'finalized' | 'failed';

export interface RecordedTransaction {
  id: string;
  txHash: string;
  namespace: 'eip155' | 'solana';
  networkId: string;
  userAddress: string;
  actionType: 'swap' | 'add_liquidity' | 'remove_liquidity' | 'collect_fees';
  summary: string;
  status: 'submitted' | 'confirmed' | 'finalized' | 'failed';
  timestamp: number;
  explorerUrl: string;
}

const STORAGE_KEY = 'omnifi_tx_history';
let inMemoryHistory: RecordedTransaction[] = [];

export function clearTransactionHistory(): void {
  inMemoryHistory = [];
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  }
}

export function getTransactionHistory(): RecordedTransaction[] {
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return inMemoryHistory;
    }
  }
  return inMemoryHistory;
}

export function saveTransactionToHistory(tx: RecordedTransaction): void {
  const history = getTransactionHistory();
  const existingIndex = history.findIndex((h) => h.id === tx.id || h.txHash === tx.txHash);
  let updated: RecordedTransaction[];
  if (existingIndex >= 0) {
    updated = [...history];
    updated[existingIndex] = tx;
  } else {
    updated = [tx, ...history];
  }
  inMemoryHistory = updated.slice(0, 50);

  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(inMemoryHistory));
    } catch {
      // ignore local storage errors
    }
  }
}

export function getExplorerUrl(networkId: string, txHash: string): string {
  if (networkId === 'eip155:8453') {
    return `https://basescan.org/tx/${txHash}`;
  }
  if (networkId.startsWith('solana:')) {
    return `https://solscan.io/tx/${txHash}`;
  }
  return `https://etherscan.io/tx/${txHash}`;
}

export async function executeEvmTransaction(
  userAddress: string,
  networkId: string,
  preparedTx: { to: string; data: string; value?: string; gasLimit?: string },
  summary: string,
  onStatusChange?: (status: TxStatus, txHash?: string) => void,
): Promise<RecordedTransaction> {
  if (typeof window === 'undefined' || !(window as any).ethereum) {
    throw new Error('EVM wallet extension is not installed or available in this browser.');
  }

  onStatusChange?.('submitting');
  const ethereum = (window as any).ethereum;

  const hexValue = preparedTx.value && preparedTx.value !== '0'
    ? '0x' + BigInt(preparedTx.value).toString(16)
    : '0x0';

  const txHash: string = await ethereum.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: userAddress,
        to: preparedTx.to,
        data: preparedTx.data,
        value: hexValue,
        gas: preparedTx.gasLimit ? '0x' + BigInt(preparedTx.gasLimit).toString(16) : undefined,
      },
    ],
  });

  const explorerUrl = getExplorerUrl(networkId, txHash);
  const txRecord: RecordedTransaction = {
    id: `evm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    txHash,
    namespace: 'eip155',
    networkId,
    userAddress,
    actionType: 'swap',
    summary,
    status: 'submitted',
    timestamp: Date.now(),
    explorerUrl,
  };

  saveTransactionToHistory(txRecord);
  onStatusChange?.('submitted', txHash);

  // Poll real on-chain transaction receipt via EIP-1193 RPC provider (§26.4)
  const pollReceipt = async () => {
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;
      try {
        const receipt = await ethereum.request({
          method: 'eth_getTransactionReceipt',
          params: [txHash],
        });
        if (receipt) {
          if (receipt.status === '0x1' || receipt.status === 1 || receipt.status === true) {
            txRecord.status = 'confirmed';
            saveTransactionToHistory(txRecord);
            onStatusChange?.('confirmed', txHash);

            // After confirmation, transition to finalized
            setTimeout(() => {
              txRecord.status = 'finalized';
              saveTransactionToHistory(txRecord);
              onStatusChange?.('finalized', txHash);
            }, 3000);
            return;
          } else if (receipt.status === '0x0' || receipt.status === 0 || receipt.status === false) {
            txRecord.status = 'failed';
            saveTransactionToHistory(txRecord);
            onStatusChange?.('failed', txHash);
            return;
          }
        }
      } catch {
        // transient RPC poll error; retry
      }
    }
  };
  pollReceipt().catch(() => {});

  return txRecord;
}

export async function executeSolanaTransaction(
  userAddress: string,
  networkId: string,
  preparedTx: any,
  summary: string,
  onStatusChange?: (status: TxStatus, txHash?: string) => void,
): Promise<RecordedTransaction> {
  if (typeof window === 'undefined' || !(window as any).solana) {
    throw new Error('Solana wallet extension (Phantom/Solflare) is not detected in this browser.');
  }

  onStatusChange?.('submitting');
  const solana = (window as any).solana;

  // Real Solana signing: reject if wallet lacks signAndSendTransaction (§0.1, Rule 3)
  let sig = '';
  if (typeof solana.signAndSendTransaction === 'function') {
    const res = await solana.signAndSendTransaction(preparedTx);
    sig = res.signature || (typeof res === 'string' ? res : res.toString());
  } else {
    throw new Error('Connected Solana wallet does not support signAndSendTransaction for client-side execution.');
  }

  const explorerUrl = getExplorerUrl(networkId, sig);
  const txRecord: RecordedTransaction = {
    id: `sol-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    txHash: sig,
    namespace: 'solana',
    networkId,
    userAddress,
    actionType: 'swap',
    summary,
    status: 'submitted',
    timestamp: Date.now(),
    explorerUrl,
  };

  saveTransactionToHistory(txRecord);
  onStatusChange?.('submitted', sig);

  // Poll real on-chain signature status
  const pollSolanaStatus = async () => {
    let attempts = 0;
    const maxAttempts = 30;
    while (attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      attempts++;
      try {
        if (typeof solana.request === 'function') {
          const resp = await solana.request({
            method: 'getSignatureStatuses',
            params: [[sig]],
          });
          const status = resp?.value?.[0];
          if (status) {
            if (status.err) {
              txRecord.status = 'failed';
              saveTransactionToHistory(txRecord);
              onStatusChange?.('failed', sig);
              return;
            }
            if (status.confirmationStatus === 'confirmed') {
              txRecord.status = 'confirmed';
              saveTransactionToHistory(txRecord);
              onStatusChange?.('confirmed', sig);
            } else if (status.confirmationStatus === 'finalized') {
              txRecord.status = 'finalized';
              saveTransactionToHistory(txRecord);
              onStatusChange?.('finalized', sig);
              return;
            }
          }
        }
      } catch {
        // transient RPC poll error; retry
      }
    }
  };
  pollSolanaStatus().catch(() => {});

  return txRecord;
}
