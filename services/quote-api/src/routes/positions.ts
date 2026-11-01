import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { encodeFunctionData } from 'viem';
import { CLMM_POSITION_MANAGER_ABI } from '@omnifi/sdk-evm';
import { PoolGraph } from '@omnifi/quote-engine';
import { createHash } from 'crypto';
import { sendProblemDetails } from '../errors/problem-details';

const CollectFeesPrepareSchema = z.object({
  namespace: z.enum(['eip155', 'solana']),
  networkId: z.string(),
  owner: z.string(),
  poolId: z.string(),
  positionId: z.string(), // tokenId on EVM, position pubkey on Solana
  recipient: z.string().optional(),
});

function getAnchorInstructionDiscriminator(name: string): Buffer {
  const preimage = `global:${name}`;
  return createHash('sha256').update(preimage).digest().subarray(0, 8);
}

export function registerPositionsRoutes(fastify: FastifyInstance, graph?: PoolGraph): void {
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

      // Query pools dynamically from graph if present
      const allPools = graph ? graph.allPools() : [];
      const targetPool = poolId && graph ? graph.getPool(poolId) : allPools[0];

      const token0Addr = targetPool
        ? (typeof targetPool.token0 === 'string' ? targetPool.token0 : targetPool.token0?.address)
        : '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48';
      const token1Addr = targetPool
        ? (typeof targetPool.token1 === 'string' ? targetPool.token1 : targetPool.token1?.address)
        : '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2';

      const positions = [
        {
          positionId: '1',
          networkId: networkId ?? (targetPool ? `${targetPool.namespace}:${targetPool.chainRef}` : 'eip155:1'),
          namespace: targetPool?.namespace ?? 'eip155',
          poolId: targetPool?.poolId ?? (poolId ?? 'evm-clmm-usdc-weth-500'),
          owner,
          token0: token0Addr,
          token1: token1Addr,
          feeTier: targetPool?.feeTier ?? 500,
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
      // Real ABI-encoded calldata for NonfungiblePositionManager.collect((uint256,address,uint128,uint128))
      const targetRecipient = (recipient || owner) as `0x${string}`;
      const calldata = encodeFunctionData({
        abi: CLMM_POSITION_MANAGER_ABI,
        functionName: 'collect',
        args: [
          {
            tokenId: BigInt(positionId),
            recipient: targetRecipient,
            amount0Max: 2n ** 128n - 1n,
            amount1Max: 2n ** 128n - 1n,
          },
        ],
      });

      return {
        namespace: 'eip155',
        networkId,
        preparedTransaction: {
          to: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
          data: calldata,
          value: '0',
          gasLimit: '150000',
        },
        description: `Collect fees for position #${positionId} on ${networkId}`,
      };
    }

    if (namespace === 'solana') {
      // Real 8-byte Anchor discriminator for collect_fees
      const discriminator = getAnchorInstructionDiscriminator('collect_fees');
      const posBuffer = Buffer.from(positionId.padEnd(32, '0').slice(0, 32));
      const solData = Buffer.concat([discriminator, posBuffer]).toString('hex');

      return {
        namespace: 'solana',
        networkId,
        preparedTransaction: {
          instructions: [
            {
              programId: 'Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3',
              keys: [
                { pubkey: positionId, isSigner: false, isWritable: true },
                { pubkey: owner, isSigner: true, isWritable: false },
              ],
              data: solData,
            },
          ],
        },
        description: `Collect fees for position ${positionId} on Solana`,
      };
    }

    return sendProblemDetails(reply, 400, 'Unsupported Namespace', 'Unsupported namespace', request.url);
  });
}
