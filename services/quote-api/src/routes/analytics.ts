import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';

export function registerAnalyticsRoutes(fastify: FastifyInstance): void {
  // GET /api/v1/analytics/overview
  fastify.get(
    '/api/v1/analytics/overview',
    async (
      request: FastifyRequest<{
        Querystring: { networkId?: string };
      }>,
    ) => {
      const { networkId } = request.query;

      return {
        networkId: networkId ?? 'all',
        totalTvlUsd: '150000000',
        totalVolume24hUsd: '45000000',
        totalFees24hUsd: '135000',
        totalPools: 12,
        totalSwaps24h: 3420,
        updatedAt: new Date().toISOString(),
      };
    },
  );

  // GET /api/v1/analytics/pools/:network/:poolId
  fastify.get(
    '/api/v1/analytics/pools/:network/:poolId',
    async (
      request: FastifyRequest<{
        Params: { network: string; poolId: string };
      }>,
    ) => {
      const { network, poolId } = request.params;

      return {
        networkId: network,
        poolId,
        volume24hUsd: '12500000',
        fees24hUsd: '37500',
        tvlUsd: '35000000',
        swapCount24h: 890,
        volume7dUsd: '85000000',
        feeApy: '14.5%',
        updatedAt: new Date().toISOString(),
      };
    },
  );
}

