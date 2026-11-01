import { AssetRef, PoolRef } from '@omnifi/domain';
import { PoolGraph } from '@omnifi/quote-engine';

export const ETH_USDC: AssetRef = {
  namespace: 'eip155',
  chainRef: '1',
  address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
};

export const ETH_WETH: AssetRef = {
  namespace: 'eip155',
  chainRef: '1',
  address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
};

export const ETH_USDT: AssetRef = {
  namespace: 'eip155',
  chainRef: '1',
  address: '0xdac17f958d2ee523a2206206994597c13d831ec7',
};

export const SOL_WSOL: AssetRef = {
  namespace: 'solana',
  chainRef: 'mainnet-beta',
  address: 'So11111111111111111111111111111111111111112',
};

export const SOL_USDC: AssetRef = {
  namespace: 'solana',
  chainRef: 'mainnet-beta',
  address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
};

export const SOL_USDT: AssetRef = {
  namespace: 'solana',
  chainRef: 'mainnet-beta',
  address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
};

export function createDefaultGraph(): PoolGraph {
  const graph = new PoolGraph();

  // 1. EVM V2 Pools
  graph.addPool({
    poolId: 'evm-v2-usdc-weth',
    namespace: 'eip155',
    chainRef: '1',
    poolType: 'v2',
    token0: ETH_USDC,
    token1: ETH_WETH,
    feeTier: 3000,
    state: {
      reserve0: 50_000_000_000_000n, // 50M USDC
      reserve1: 25_000_000_000_000_000_000_000n, // 25,000 WETH (2000 USDC/ETH)
    },
  });

  graph.addPool({
    poolId: 'evm-v2-weth-usdt',
    namespace: 'eip155',
    chainRef: '1',
    poolType: 'v2',
    token0: ETH_WETH,
    token1: ETH_USDT,
    feeTier: 3000,
    state: {
      reserve0: 25_000_000_000_000_000_000_000n, // 25,000 WETH
      reserve1: 50_000_000_000_000n, // 50M USDT
    },
  });

  graph.addPool({
    poolId: 'evm-v3-usdc-usdt',
    namespace: 'eip155',
    chainRef: '1',
    poolType: 'v2',
    token0: ETH_USDC,
    token1: ETH_USDT,
    feeTier: 500, // 0.05%
    state: {
      reserve0: 100_000_000_000_000n, // 100M USDC
      reserve1: 100_000_000_000_000n, // 100M USDT
    },
  });

  // 2. Solana Pools
  graph.addPool({
    poolId: 'solana-amm-usdc-wsol',
    namespace: 'solana',
    chainRef: 'mainnet-beta',
    poolType: 'solana_amm',
    token0: SOL_USDC,
    token1: SOL_WSOL,
    feeTier: 3000,
    state: {
      reserve0: 20_000_000_000_000n, // 20M USDC
      reserve1: 100_000_000_000_000n, // 100k SOL (200 USDC/SOL)
      protocolFeeFraction: 250_000,
    },
  });

  graph.addPool({
    poolId: 'solana-clmm-usdc-wsol',
    namespace: 'solana',
    chainRef: 'mainnet-beta',
    poolType: 'solana_clmm',
    token0: SOL_USDC,
    token1: SOL_WSOL,
    feeTier: 500, // 0.05%
    tickSpacing: 10,
    state: {
      sqrtPriceX64: 18446744073709551616n, // 1.0 (or normalized)
      currentTick: 0,
      liquidity: 500_000_000_000_000n,
      tickSpacing: 10,
    },
  });

  graph.addPool({
    poolId: 'solana-amm-wsol-usdt',
    namespace: 'solana',
    chainRef: 'mainnet-beta',
    poolType: 'solana_amm',
    token0: SOL_WSOL,
    token1: SOL_USDT,
    feeTier: 3000,
    state: {
      reserve0: 50_000_000_000_000n,
      reserve1: 10_000_000_000_000n,
      protocolFeeFraction: 250_000,
    },
  });

  return graph;
}

