'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { TokenResponse, QuoteResponse } from '@omnifi/api-client';
import { useWallet } from '../../context/WalletContext';
import { apiClient } from '../../lib/api';
import { executeEvmTransaction, executeSolanaTransaction, TxStatus } from '../../lib/tx-executor';
import { TokenSelectorModal } from './TokenSelectorModal';

export function TradingCockpit() {
  const { walletType, address, selectedNetworkId, isNetworkMismatch } = useWallet();

  const [tokens, setTokens] = useState<readonly TokenResponse[]>([]);
  const [tokenIn, setTokenIn] = useState<TokenResponse | null>(null);
  const [tokenOut, setTokenOut] = useState<TokenResponse | null>(null);
  const [amountIn, setAmountIn] = useState<string>('100');
  const [slippageBps, setSlippageBps] = useState<number>(50); // 0.5%
  const [customSlippage, setCustomSlippage] = useState<string>('');

  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState<boolean>(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);

  const [isImpactConfirmed, setIsImpactConfirmed] = useState<boolean>(false);
  const [isTokenInModalOpen, setIsTokenInModalOpen] = useState<boolean>(false);
  const [isTokenOutModalOpen, setIsTokenOutModalOpen] = useState<boolean>(false);

  // Execution & Transaction States (§26.4: Submitted -> Confirmed -> Finalized)
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [activeTxHash, setActiveTxHash] = useState<string | null>(null);
  const [executionError, setExecutionError] = useState<string | null>(null);

  // Load tokens on network change
  useEffect(() => {
    let isCancelled = false;
    async function loadTokens() {
      try {
        const resp = await apiClient.listTokens(selectedNetworkId);
        if (!isCancelled && resp.tokens.length > 0) {
          setTokens(resp.tokens);
          setTokenIn(resp.tokens[0] || null);
          setTokenOut(resp.tokens[1] || resp.tokens[0] || null);
        }
      } catch (err: any) {
        if (!isCancelled) {
          console.error('Failed to load tokens:', err);
        }
      }
    }
    loadTokens();
    return () => {
      isCancelled = true;
    };
  }, [selectedNetworkId]);

  // Fetch real quote from quote-api
  const fetchQuote = useCallback(async () => {
    if (!tokenIn || !tokenOut || !amountIn || Number(amountIn) <= 0) {
      setQuote(null);
      setQuoteError(null);
      return;
    }

    if (tokenIn.address.toLowerCase() === tokenOut.address.toLowerCase()) {
      setQuote(null);
      setQuoteError('Cannot swap identical assets');
      return;
    }

    setIsLoadingQuote(true);
    setQuoteError(null);

    try {
      // Calculate integer units with tokenIn decimals
      const parsedAmount = BigInt(Math.floor(Number(amountIn) * Math.pow(10, tokenIn.decimals))).toString();
      const resp = await apiClient.getQuote({
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amount: parsedAmount,
        exactIn: true,
      });
      setQuote(resp);
    } catch (err: any) {
      setQuote(null);
      setQuoteError(err?.message || 'No routing liquidity available for this pair');
    } finally {
      setIsLoadingQuote(false);
    }
  }, [tokenIn, tokenOut, amountIn]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchQuote();
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchQuote]);

  // Handle Switch
  const handleSwitchTokens = () => {
    setTokenIn(tokenOut);
    setTokenOut(tokenIn);
  };

  // Price impact calculation
  const priceImpactBps = quote?.priceImpactBps ?? 0;
  const isHighImpact = priceImpactBps >= 100; // >= 1%
  const isCriticalImpact = priceImpactBps >= 500; // >= 5%
  const isExecutionBlocked = isCriticalImpact && !isImpactConfirmed;

  // Execute Swap via Decoupled Key Management (ADR-011)
  const handleExecuteSwap = async () => {
    if (!address) return;
    if (!tokenIn || !tokenOut || !quote) return;

    setExecutionError(null);
    setTxStatus('preparing');

    try {
      const namespace = selectedNetworkId.startsWith('solana:') ? 'solana' : 'eip155';
      const protocol = namespace === 'solana' ? 'amm' : 'v2';

      // Minimum amount out factoring in slippage
      const rawAmountOut = BigInt(quote.amountOut);
      const minAmountOut = (rawAmountOut * BigInt(10000 - slippageBps) / 10000n).toString();

      // 1. Prepare unsigned transaction
      const prepared = await apiClient.prepareSwap({
        namespace,
        networkId: selectedNetworkId,
        userAddress: address,
        protocol,
        tokenIn: tokenIn.address,
        tokenOut: tokenOut.address,
        amountIn: quote.amountIn,
        minAmountOut,
      });

      // 2. Submit to user browser wallet for signing
      const summary = `Swap ${amountIn} ${tokenIn.symbol} -> ${tokenOut.symbol}`;

      if (namespace === 'eip155') {
        await executeEvmTransaction(
          address,
          selectedNetworkId,
          prepared.preparedTransaction,
          summary,
          (status, hash) => {
            setTxStatus(status);
            if (hash) setActiveTxHash(hash);
          },
        );
      } else {
        await executeSolanaTransaction(
          address,
          selectedNetworkId,
          prepared.preparedTransaction,
          summary,
          (status, hash) => {
            setTxStatus(status);
            if (hash) setActiveTxHash(hash);
          },
        );
      }
    } catch (err: any) {
      console.error('Swap execution error:', err);
      setTxStatus('failed');
      setExecutionError(err?.message || 'Transaction was rejected or failed');
    }
  };

  // Output token formatted display
  const formattedOutAmount = quote && tokenOut
    ? (Number(BigInt(quote.amountOut)) / Math.pow(10, tokenOut.decimals)).toFixed(6)
    : '0.00';

  return (
    <div style={{ maxWidth: '480px', margin: '2rem auto', padding: '0 1rem' }}>
      <div className="card" style={{ position: 'relative', boxShadow: 'var(--shadow-elevation)' }}>
        {/* Header */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>Swap Cockpit</span>
            <span className="badge badge-submitted font-mono" style={{ fontSize: '0.7rem' }}>
              {selectedNetworkId}
            </span>
          </div>

          {/* Slippage Selector */}
          <div style={{ display: 'flex', gap: '0.25rem', alignItems: 'center' }}>
            {[10, 50, 100].map((bps) => (
              <button
                key={bps}
                className="btn btn-secondary font-mono"
                style={{
                  padding: '0.2rem 0.5rem',
                  fontSize: '0.75rem',
                  borderColor: slippageBps === bps ? 'var(--accent-cyber)' : 'var(--border-subtle)',
                  color: slippageBps === bps ? 'var(--accent-cyber)' : 'var(--text-secondary)',
                }}
                onClick={() => {
                  setSlippageBps(bps);
                  setCustomSlippage('');
                }}
              >
                {(bps / 100).toFixed(1)}%
              </button>
            ))}
          </div>
        </div>

        {/* Token In Box */}
        <div
          style={{
            background: 'var(--surface-overlay)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginBottom: '0.5rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>You Pay</span>
            <span>Asset: {tokenIn?.name || 'Selected'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <input
              type="number"
              min="0"
              step="any"
              className="input-field font-mono"
              placeholder="0.0"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              style={{
                fontSize: '1.35rem',
                fontWeight: 700,
                border: 'none',
                background: 'transparent',
                padding: '0.25rem 0',
              }}
            />
            <button
              onClick={() => setIsTokenInModalOpen(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                padding: '0.5rem 0.85rem',
                flexShrink: 0,
              }}
            >
              <span>{tokenIn?.symbol || 'Select'}</span>
              <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>
          </div>
        </div>

        {/* Switch Button */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '-0.3rem 0' }}>
          <button
            onClick={handleSwitchTokens}
            className="btn btn-secondary font-mono"
            style={{
              padding: '0.35rem 0.65rem',
              borderRadius: '50%',
              zIndex: 2,
              background: 'var(--surface-base)',
              boxShadow: 'var(--shadow-elevation)',
            }}
          >
            ⇅
          </button>
        </div>

        {/* Token Out Box */}
        <div
          style={{
            background: 'var(--surface-overlay)',
            padding: '1rem',
            borderRadius: '12px',
            border: '1px solid var(--border-subtle)',
            marginTop: '0.5rem',
            marginBottom: '1rem',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: '0.5rem',
              fontSize: '0.8rem',
              color: 'var(--text-muted)',
            }}
          >
            <span>You Receive (Estimated)</span>
            <span>Asset: {tokenOut?.name || 'Selected'}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              className="font-mono"
              style={{
                flex: 1,
                fontSize: '1.35rem',
                fontWeight: 700,
                color: isLoadingQuote ? 'var(--text-muted)' : 'var(--text-primary)',
              }}
            >
              {isLoadingQuote ? 'Calculating...' : formattedOutAmount}
            </div>
            <button
              onClick={() => setIsTokenOutModalOpen(true)}
              className="btn btn-secondary"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontWeight: 700,
                padding: '0.5rem 0.85rem',
                flexShrink: 0,
              }}
            >
              <span>{tokenOut?.symbol || 'Select'}</span>
              <span style={{ fontSize: '0.7rem' }}>▼</span>
            </button>
          </div>
        </div>

        {/* Quote Details */}
        {quote && (
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.02)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '8px',
              padding: '0.85rem',
              fontSize: '0.8rem',
              marginBottom: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Rate</span>
              <span className="font-mono">
                1 {tokenIn?.symbol} ≈ {Number(quote.executionPrice).toFixed(6)} {tokenOut?.symbol}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>Price Impact</span>
              <span
                className="font-mono"
                style={{
                  color:
                    priceImpactBps >= 500
                      ? 'var(--accent-crimson)'
                      : priceImpactBps >= 100
                      ? 'var(--accent-amber)'
                      : 'var(--accent-cyber)',
                  fontWeight: 600,
                }}
              >
                {(priceImpactBps / 100).toFixed(2)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-muted)' }}>Max Slippage</span>
              <span className="font-mono">{(slippageBps / 100).toFixed(2)}%</span>
            </div>
          </div>
        )}

        {/* High Price Impact Warning */}
        {isHighImpact && (
          <div
            style={{
              background: isCriticalImpact
                ? 'rgba(255, 59, 92, 0.1)'
                : 'rgba(245, 158, 11, 0.1)',
              border: `1px solid ${
                isCriticalImpact ? 'var(--accent-crimson)' : 'var(--accent-amber)'
              }`,
              borderRadius: '8px',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.8rem',
            }}
          >
            <div
              style={{
                fontWeight: 700,
                color: isCriticalImpact ? 'var(--accent-crimson)' : 'var(--accent-amber)',
                marginBottom: '0.25rem',
              }}
            >
              ⚠ High Price Impact: {(priceImpactBps / 100).toFixed(2)}%
            </div>
            <p style={{ margin: '0 0 0.5rem 0', color: 'var(--text-secondary)' }}>
              This trade will move the market price substantially due to pool liquidity constraints.
            </p>
            {isCriticalImpact && (
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                <input
                  type="checkbox"
                  checked={isImpactConfirmed}
                  onChange={(e) => setIsImpactConfirmed(e.target.checked)}
                />
                <span>I understand and accept high slippage / execution loss</span>
              </label>
            )}
          </div>
        )}

        {/* Quote Error */}
        {quoteError && (
          <div
            style={{
              background: 'rgba(255, 59, 92, 0.1)',
              border: '1px solid var(--accent-crimson)',
              color: 'var(--accent-crimson)',
              padding: '0.75rem',
              borderRadius: '8px',
              fontSize: '0.85rem',
              marginBottom: '1rem',
            }}
          >
            {quoteError}
          </div>
        )}

        {/* Action Button */}
        {!address ? (
          <button
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.85rem', fontSize: '1rem' }}
            disabled
          >
            Connect Wallet To Trade
          </button>
        ) : isNetworkMismatch ? (
          <button
            className="btn btn-secondary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              borderColor: 'var(--accent-amber)',
              color: 'var(--accent-amber)',
            }}
            disabled
          >
            Network Mismatch Detected
          </button>
        ) : (
          <button
            onClick={handleExecuteSwap}
            disabled={
              !quote ||
              isLoadingQuote ||
              isExecutionBlocked ||
              txStatus === 'preparing' ||
              txStatus === 'submitting'
            }
            className="btn btn-primary"
            style={{
              width: '100%',
              padding: '0.85rem',
              fontSize: '1rem',
              opacity: isExecutionBlocked || !quote ? 0.6 : 1,
            }}
          >
            {txStatus === 'preparing'
              ? 'Preparing Unsigned Payload...'
              : txStatus === 'submitting'
              ? 'Waiting for Wallet Signature...'
              : isExecutionBlocked
              ? 'Price Impact Too High'
              : 'Swap Now'}
          </button>
        )}

        {/* Multi-tier Transaction Status Display (§26.4) */}
        {txStatus !== 'idle' && (
          <div
            style={{
              marginTop: '1rem',
              padding: '0.85rem',
              borderRadius: '8px',
              background: 'var(--surface-overlay)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '0.5rem',
              }}
            >
              <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Transaction Lifecycle</span>
              <span
                className={`badge ${
                  txStatus === 'submitted'
                    ? 'badge-submitted'
                    : txStatus === 'confirmed'
                    ? 'badge-confirmed'
                    : txStatus === 'finalized'
                    ? 'badge-finalized'
                    : txStatus === 'failed'
                    ? 'badge-failed'
                    : 'badge-submitted'
                }`}
              >
                {txStatus.toUpperCase()}
              </span>
            </div>

            {/* Stepper bar */}
            <div style={{ display: 'flex', gap: '4px', height: '4px', marginBottom: '0.6rem' }}>
              <div
                style={{
                  flex: 1,
                  background:
                    txStatus === 'submitted' || txStatus === 'confirmed' || txStatus === 'finalized'
                      ? 'var(--accent-blue)'
                      : 'var(--border-subtle)',
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  flex: 1,
                  background:
                    txStatus === 'confirmed' || txStatus === 'finalized'
                      ? 'var(--accent-cyber)'
                      : 'var(--border-subtle)',
                  borderRadius: '2px',
                }}
              />
              <div
                style={{
                  flex: 1,
                  background:
                    txStatus === 'finalized' ? 'var(--accent-purple)' : 'var(--border-subtle)',
                  borderRadius: '2px',
                }}
              />
            </div>

            {activeTxHash && (
              <div
                className="font-mono"
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  justifyContent: 'space-between',
                }}
              >
                <span>Hash: {activeTxHash.slice(0, 10)}...{activeTxHash.slice(-8)}</span>
                <a
                  href={
                    selectedNetworkId.startsWith('solana:')
                      ? `https://solscan.io/tx/${activeTxHash}`
                      : selectedNetworkId === 'eip155:8453'
                      ? `https://basescan.org/tx/${activeTxHash}`
                      : `https://etherscan.io/tx/${activeTxHash}`
                  }
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'var(--accent-cyber)', textDecoration: 'underline' }}
                >
                  View Explorer ↗
                </a>
              </div>
            )}

            {executionError && (
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--accent-crimson)',
                  marginTop: '0.4rem',
                }}
              >
                {executionError}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Asset Selector Modals */}
      <TokenSelectorModal
        isOpen={isTokenInModalOpen}
        tokens={tokens}
        selectedAddress={tokenIn?.address}
        onSelectToken={(t) => setTokenIn(t)}
        onClose={() => setIsTokenInModalOpen(false)}
      />

      <TokenSelectorModal
        isOpen={isTokenOutModalOpen}
        tokens={tokens}
        selectedAddress={tokenOut?.address}
        onSelectToken={(t) => setTokenOut(t)}
        onClose={() => setIsTokenOutModalOpen(false)}
      />
    </div>
  );
}
