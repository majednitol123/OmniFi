import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sendProblemDetails } from '../errors/problem-details';

const CollectFeesPrepareSchema = z.object({
  namespace: z.enum(['eip155', 'solana']),
  networkId: z.string(),
  owner: z.string(),
  poolId: z.string(),
  positionId: z.string(), // tokenId on EVM, position pubkey on Solana
  recipient: z.string().optional(),
});

export function registerPositionsRoutes(fastify: FastifyInstance): void {
  // GET /api/v1/positions
  fastify.get(
    '/api/v1/positions',
    async (
      request: FastifyRequest<{
        Querystring: {
          owner: string;
          networkId?: string;
          poolId?: string;
        };
      }>,
      reply: FastifyReply,
    ) => {
      const { owner, networkId, poolId } = request.query;
      if (!owner) {
        return sendProblemDetails(
          reply,
          400,
          'Bad Request',
          'Query parameter "owner" is required.',
          request.url,
        );
      }

      // Positions projection (mock / populated by indexer in production)
      const positions = [
        {
          positionId: '1',
          networkId: networkId ?? 'eip155:1',
          namespace: 'eip155',
          poolId: poolId ?? 'evm-clmm-usdc-weth-500',
          owner,
          token0: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48',
          token1: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
          feeTier: 500,
          tickLower: -120,
          tickUpper: 120,
          liquidity: '1000000000000',
          tokensOwed0: '50000',
          tokensOwed1: '25000000000000',
        },
      ];

      return {
        positions,
        total: positions.length,
      };
    },
  );

  // POST /api/v1/positions/collect/prepare
  fastify.post('/api/v1/positions/collect/prepare', async (request, reply) => {
    const parseResult = CollectFeesPrepareSchema.safeParse(request.body);
    if (!parseResult.success) {
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Body',
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        request.url,
      );
    }

    const { namespace, networkId, owner, positionId, recipient } = parseResult.data;

    if (namespace === 'eip155') {
      // Return prepared unsigned transaction for NonfungiblePositionManager.collect()
      // Selector: 0xfc6f7865 collect((uint256,address,uint128,uint128))
      return {
        namespace: 'eip155',
        networkId,
        preparedTransaction: {
          to: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88', // standard CLMM PositionManager
          data: '0xfc6f7865',
          value: '0',
          gasLimit: '150000',
        },
        description: `Collect fees for position #${positionId} on ${networkId}`,
      };
    }

    if (namespace === 'solana') {
      return {
        namespace: 'solana',
        networkId,
        preparedTransaction: {
          instructions: [
            {
              programId: 'BSn4qU6Reocr7apUznvRkXLQ4psydsrayW9YWyToD6x2',
              keys: [
                { pubkey: positionId, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false },
              ],
              data: 'collect_fees_mock_payload',
            },
          ],
        },
        description: `Collect fees for position ${positionId} on Solana`,
      };
    }

    return sendProblemDetails(reply, 400, 'Unsupported Namespace', 'Unsupported namespace', request.url);
  });
}

