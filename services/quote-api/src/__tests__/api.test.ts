import { FastifyInstance } from 'fastify';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { ETH_USDC, ETH_WETH, SOL_USDC, SOL_WSOL } from '../registry/default-pools';
import { buildServer } from '../server';

describe('Quote API Integration Tests', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    app = await buildServer({ enableRateLimit: false });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /health returns 200 and healthy status', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.status).toBe('healthy');
  });

  it('GET /api/v1/quotes returns optimal quote for valid EVM pair', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/quotes',
      query: {
        tokenIn: 'eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48', // USDC
        tokenOut: 'eip155:1:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2', // WETH
        amountIn: '1000000000', // 1,000 USDC
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.quoteId).toBeDefined();
    expect(body.amountIn).toBe('1000000000');
    expect(BigInt(body.amountOut)).toBeGreaterThan(0n);
    expect(body.routes).toBeDefined();
    expect(body.routes.length).toBeGreaterThan(0);
    expect(body.priceImpact).toBeDefined();
    expect(body.priceImpact.level).toBe('low');
  });

  it('GET /api/v1/quotes returns optimal quote for valid Solana pair', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/quotes',
      query: {
        tokenIn: 'solana:mainnet-beta:EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        tokenOut: 'solana:mainnet-beta:So11111111111111111111111111111111111111112', // WSOL
        amountIn: '100000000', // 100 USDC
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.quoteId).toBeDefined();
    expect(body.namespace).toBe('solana');
    expect(BigInt(body.amountOut)).toBeGreaterThan(0n);
  });

  it('GET /api/v1/quotes returns 400 Problem Details for malformed token ref', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/quotes',
      query: {
        tokenIn: 'USDC', // Symbol-only (forbidden)
        tokenOut: 'eip155:1:0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        amountIn: '1000000',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const problem = JSON.parse(res.body);
    expect(problem.status).toBe(400);
    expect(problem.title).toBe('Invalid Request Parameters');
    expect(problem.invalidParams).toBeDefined();
  });

  it('GET /api/v1/quotes returns 400 Problem Details for cross-chain swap', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/quotes',
      query: {
        tokenIn: 'eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenOut: 'solana:mainnet-beta:So11111111111111111111111111111111111111112',
        amountIn: '1000000',
      },
    });

    expect(res.statusCode).toBe(400);
    expect(res.headers['content-type']).toContain('application/problem+json');
    const problem = JSON.parse(res.body);
    expect(problem.title).toBe('Cross-Chain Routing Unsupported');
  });

  it('GET /api/v1/routes discovers candidate paths', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/routes',
      query: {
        tokenIn: 'eip155:1:0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenOut: 'eip155:1:0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
        maxHops: '3',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.totalRoutesFound).toBeGreaterThan(0);
    expect(body.routes).toBeDefined();
  });

  it('POST /api/v1/simulate executes dry-run simulation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/simulate',
      payload: {
        intent: {
          intentId: 'test-intent-1',
          quoteId: 'test-quote-1',
          namespace: 'solana',
          chainRef: 'mainnet-beta',
          to: 'So11111111111111111111111111111111111111112',
          instructions: [
            {
              programId: 'BSn4qU6Reocr7apUznvRkXLQ4psydsrayW9YWyToD6x2',
              keys: [],
              data: '',
            },
          ],
        },
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.intentId).toBe('test-intent-1');
    expect(body.success).toBe(true);
  });

  it('GET /api/v1/networks returns supported networks list', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/networks',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.networks.length).toBeGreaterThan(0);
    expect(body.networks.some((n: any) => n.networkId === 'eip155:1')).toBe(true);
    expect(body.networks.some((n: any) => n.networkId === 'solana:mainnet-beta')).toBe(true);
  });

  it('GET /api/v1/tokens returns filtered tokens', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tokens',
      query: { networkId: 'eip155:1' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.tokens.length).toBeGreaterThan(0);
    expect(body.tokens.every((t: any) => t.networkId === 'eip155:1')).toBe(true);
  });

  it('GET /api/v1/tokens/:network/:asset returns specific token metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/tokens/eip155:1/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.symbol).toBe('USDC');
    expect(body.decimals).toBe(6);
  });

  it('GET /api/v1/pools returns list of pools and single pool details', async () => {
    const resList = await app.inject({
      method: 'GET',
      url: '/api/v1/pools',
      query: { protocol: 'v2' },
    });
    expect(resList.statusCode).toBe(200);
    const listBody = JSON.parse(resList.body);
    expect(listBody.pools.length).toBeGreaterThan(0);

    const resSingle = await app.inject({
      method: 'GET',
      url: '/api/v1/pools/eip155:1/evm-v2-usdc-weth',
    });
    expect(resSingle.statusCode).toBe(200);
    const singleBody = JSON.parse(resSingle.body);
    expect(singleBody.poolId).toBe('evm-v2-usdc-weth');
    expect(singleBody.feeTier).toBe(3000);
  });

  it('GET /api/v1/positions queries user positions', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/positions',
      query: { owner: '0x1111111111111111111111111111111111111111' },
    });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.positions.length).toBeGreaterThan(0);
    expect(body.positions[0].owner).toBe('0x1111111111111111111111111111111111111111');
  });

  it('POST /api/v1/swap/prepare prepares unsigned swap payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/swap/prepare',
      payload: {
        namespace: 'eip155',
        networkId: 'eip155:1',
        userAddress: '0x1111111111111111111111111111111111111111',
        protocol: 'v2',
        tokenIn: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        tokenOut: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        amountIn: '1000000000',
        minAmountOut: '450000000000000000',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.namespace).toBe('eip155');
    expect(body.preparedTransaction.data).toBe('0x38ed1739');
  });

  it('POST /api/v1/liquidity/add/prepare and remove/prepare return unsigned payloads', async () => {
    const addRes = await app.inject({
      method: 'POST',
      url: '/api/v1/liquidity/add/prepare',
      payload: {
        namespace: 'eip155',
        networkId: 'eip155:1',
        userAddress: '0x1111111111111111111111111111111111111111',
        protocol: 'clmm',
        token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
        token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
        amount0Desired: '1000000',
        amount1Desired: '500000000000000',
        amount0Min: '990000',
        amount1Min: '495000000000000',
      },
    });
    expect(addRes.statusCode).toBe(200);

    const removeRes = await app.inject({
      method: 'POST',
      url: '/api/v1/liquidity/remove/prepare',
      payload: {
        namespace: 'eip155',
        networkId: 'eip155:1',
        userAddress: '0x1111111111111111111111111111111111111111',
        protocol: 'clmm',
        poolId: 'evm-clmm-usdc-weth-500',
        liquidity: '1000000',
        amount0Min: '990000',
        amount1Min: '495000000000000',
      },
    });
    expect(removeRes.statusCode).toBe(200);
  });

  it('GET /api/v1/analytics/overview and pool analytics return metrics', async () => {
    const resOverview = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/overview',
    });
    expect(resOverview.statusCode).toBe(200);
    const overviewBody = JSON.parse(resOverview.body);
    expect(overviewBody.totalTvlUsd).toBeDefined();
    expect(overviewBody.totalVolume24hUsd).toBeDefined();

    const resPool = await app.inject({
      method: 'GET',
      url: '/api/v1/analytics/pools/eip155:1/evm-v2-usdc-weth',
    });
    expect(resPool.statusCode).toBe(200);
    const poolBody = JSON.parse(resPool.body);
    expect(poolBody.poolId).toBe('evm-v2-usdc-weth');
    expect(poolBody.volume24hUsd).toBeDefined();
  });
});

