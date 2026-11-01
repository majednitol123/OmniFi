import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { createHash } from 'crypto';
import { sendProblemDetails } from '../errors/problem-details';

const SwapPrepareSchema = z.object({
  namespace: z.enum(['eip155', 'solana']),
  networkId: z.string(),
  userAddress: z.string(),
  protocol: z.enum(['v2', 'clmm', 'v4', 'amm']),
  tokenIn: z.string(),
  tokenOut: z.string(),
  amountIn: z.string(),
  minAmountOut: z.string(),
  recipient: z.string().optional(),
  deadline: z.string().optional(),
  routerAddress: z.string().optional(),
  poolAddress: z.string().optional(),
  feeTier: z.number().optional(),
});

const LiquidityAddPrepareSchema = z.object({
  namespace: z.enum(['eip155', 'solana']),
  networkId: z.string(),
  userAddress: z.string(),
  protocol: z.enum(['v2', 'clmm', 'v4', 'amm']),
  token0: z.string(),
  token1: z.string(),
  amount0Desired: z.string(),
  amount1Desired: z.string(),
  amount0Min: z.string(),
  amount1Min: z.string(),
  tickLower: z.number().optional(),
  tickUpper: z.number().optional(),
  feeTier: z.number().optional(),
  recipient: z.string().optional(),
  deadline: z.string().optional(),
});

const LiquidityRemovePrepareSchema = z.object({
  namespace: z.enum(['eip155', 'solana']),
  networkId: z.string(),
  userAddress: z.string(),
  protocol: z.enum(['v2', 'clmm', 'v4', 'amm']),
  poolId: z.string(),
  positionId: z.string().optional(), // For CLMM NFTs
  liquidity: z.string(),
  amount0Min: z.string(),
  amount1Min: z.string(),
  recipient: z.string().optional(),
  deadline: z.string().optional(),
});

function getAnchorInstructionDiscriminator(name: string): Buffer {
  const preimage = `global:${name}`;
  return createHash('sha256').update(preimage).digest().subarray(0, 8);
}

function encodeSolanaSwapData(amountIn: bigint, minAmountOut: bigint, zeroForOne: boolean): string {
  const discriminator = getAnchorInstructionDiscriminator('swap_exact_input');
  const buffer = Buffer.alloc(8 + 8 + 8 + 1);
  discriminator.copy(buffer, 0);
  buffer.writeBigUInt64LE(amountIn, 8);
  buffer.writeBigUInt64LE(minAmountOut, 16);
  buffer.writeUInt8(zeroForOne ? 1 : 0, 24);
  return buffer.toString('hex');
}

function encodeSolanaAddLiquidityData(amount0Desired: bigint, amount1Desired: bigint): string {
  const discriminator = getAnchorInstructionDiscriminator('add_liquidity');
  const buffer = Buffer.alloc(8 + 8 + 8);
  discriminator.copy(buffer, 0);
  buffer.writeBigUInt64LE(amount0Desired, 8);
  buffer.writeBigUInt64LE(amount1Desired, 16);
  return buffer.toString('hex');
}

function encodeSolanaRemoveLiquidityData(liquidity: bigint, amount0Min: bigint, amount1Min: bigint): string {
  const discriminator = getAnchorInstructionDiscriminator('remove_liquidity');
  const buffer = Buffer.alloc(8 + 16 + 8 + 8);
  discriminator.copy(buffer, 0);
  buffer.writeBigUInt64LE(liquidity & 0xffffffffffffffffn, 8);
  buffer.writeBigUInt64LE(liquidity >> 64n, 16);
  buffer.writeBigUInt64LE(amount0Min, 24);
  buffer.writeBigUInt64LE(amount1Min, 32);
  return buffer.toString('hex');
}

export function registerPrepareRoutes(fastify: FastifyInstance): void {
  // POST /api/v1/swap/prepare
  fastify.post('/api/v1/swap/prepare', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = SwapPrepareSchema.safeParse(request.body);
    if (!parseResult.success) {
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Body',
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        request.url,
      );
    }

    const {
      namespace,
      networkId,
      userAddress,
      protocol,
      tokenIn,
      tokenOut,
      amountIn,
      minAmountOut,
      recipient,
      routerAddress,
    } = parseResult.data;

    const to = routerAddress ?? (namespace === 'eip155' ? '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D' : 'Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3');

    if (namespace === 'eip155') {
      return {
        namespace: 'eip155',
        networkId,
        userAddress,
        preparedTransaction: {
          to,
          data: protocol === 'v2' ? '0x38ed1739' : '0x414bf389',
          value: '0',
          gasLimit: '250000',
        },
        metadata: {
          tokenIn,
          tokenOut,
          amountIn,
          minAmountOut,
          protocol,
        },
      };
    }

    const rawIn = BigInt(amountIn);
    const rawMinOut = BigInt(minAmountOut);
    const zeroForOne = tokenIn.toLowerCase() < tokenOut.toLowerCase();
    const solanaInstructionData = encodeSolanaSwapData(rawIn, rawMinOut, zeroForOne);

    return {
      namespace: 'solana',
      networkId,
      userAddress,
      preparedTransaction: {
        instructions: [
          {
            programId: to,
            keys: [
              { pubkey: userAddress, isSigner: true, isWritable: true },
              { pubkey: tokenIn, isSigner: false, isWritable: true },
              { pubkey: tokenOut, isSigner: false, isWritable: true },
            ],
            data: solanaInstructionData,
          },
        ],
      },
      metadata: {
        tokenIn,
        tokenOut,
        amountIn,
        minAmountOut,
        protocol,
      },
    };
  });

  // POST /api/v1/liquidity/add/prepare
  fastify.post('/api/v1/liquidity/add/prepare', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = LiquidityAddPrepareSchema.safeParse(request.body);
    if (!parseResult.success) {
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Body',
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        request.url,
      );
    }

    const { namespace, networkId, userAddress, protocol, token0, token1, amount0Desired, amount1Desired } =
      parseResult.data;

    if (namespace === 'eip155') {
      return {
        namespace: 'eip155',
        networkId,
        userAddress,
        preparedTransaction: {
          to: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
          data: '0x88316456', // mint((address,address,uint24,int24,int24,uint256,uint256,uint256,uint256,address,uint256))
          value: '0',
          gasLimit: '350000',
        },
        metadata: {
          token0,
          token1,
          amount0Desired,
          amount1Desired,
          protocol,
        },
      };
    }

    const solanaAddData = encodeSolanaAddLiquidityData(BigInt(amount0Desired), BigInt(amount1Desired));

    return {
      namespace: 'solana',
      networkId,
      userAddress,
      preparedTransaction: {
        instructions: [
          {
            programId: 'Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3',
            keys: [{ pubkey: userAddress, isSigner: true, isWritable: true }],
            data: solanaAddData,
          },
        ],
      },
      metadata: {
        token0,
        token1,
        amount0Desired,
        amount1Desired,
        protocol,
      },
    };
  });

  // POST /api/v1/liquidity/remove/prepare
  fastify.post('/api/v1/liquidity/remove/prepare', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = LiquidityRemovePrepareSchema.safeParse(request.body);
    if (!parseResult.success) {
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Body',
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        request.url,
      );
    }

    const { namespace, networkId, userAddress, poolId, liquidity, amount0Min, amount1Min } =
      parseResult.data;

    if (namespace === 'eip155') {
      return {
        namespace: 'eip155',
        networkId,
        userAddress,
        preparedTransaction: {
          to: '0xC36442b4a4522E871399CD717aBDD847Ab11FE88',
          data: '0x0c49ccbe', // decreaseLiquidity((uint256,uint128,uint256,uint256,uint256))
          value: '0',
          gasLimit: '250000',
        },
        metadata: {
          poolId,
          liquidity,
          amount0Min,
          amount1Min,
        },
      };
    }

    const solanaRemoveData = encodeSolanaRemoveLiquidityData(
      BigInt(liquidity),
      BigInt(amount0Min),
      BigInt(amount1Min),
    );

    return {
      namespace: 'solana',
      networkId,
      userAddress,
      preparedTransaction: {
        instructions: [
          {
            programId: 'Ad85ZckvQezw7n3VjYqgoXYPyV5zCsTAzrG8qMhs6La3',
            keys: [{ pubkey: userAddress, isSigner: true, isWritable: true }],
            data: solanaRemoveData,
          },
        ],
      },
      metadata: {
        poolId,
        liquidity,
        amount0Min,
        amount1Min,
      },
    };
  });
}
