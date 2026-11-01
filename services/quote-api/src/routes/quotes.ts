import { parseAssetRef } from '@omnifi/domain';
import { findBestQuote, findRoutes, PoolGraph } from '@omnifi/quote-engine';
import { FastifyInstance, FastifyPluginOptions, FastifyReply, FastifyRequest } from 'fastify';
import { sendProblemDetails } from '../errors/problem-details';
import { QuoteQuerySchema } from '../validation/schemas';

function serializeBigInts(obj: any): any {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  if (Array.isArray(obj)) {
    return obj.map(serializeBigInts);
  }
  if (typeof obj === 'object') {
    const res: any = {};
    for (const [key, value] of Object.entries(obj)) {
      res[key] = serializeBigInts(value);
    }
    return res;
  }
  return obj;
}

export function registerQuoteRoutes(fastify: FastifyInstance, graph: PoolGraph) {
  fastify.get('/api/v1/quotes', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = QuoteQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      const invalidParams = parseResult.error.errors.map((e) => ({
        name: e.path.join('.'),
        reason: e.message,
      }));
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Parameters',
        'One or more query parameters failed validation.',
        request.url,
        invalidParams,
      );
    }

    const { tokenIn: rawTokenIn, tokenOut: rawTokenOut, amountIn: rawAmountIn, allowSplits } =
      parseResult.data;

    const tokenIn = parseAssetRef(rawTokenIn)!;
    const tokenOut = parseAssetRef(rawTokenOut)!;

    if (tokenIn.namespace !== tokenOut.namespace) {
      return sendProblemDetails(
        reply,
        400,
        'Cross-Chain Routing Unsupported',
        `Swaps between differing namespaces (${tokenIn.namespace} -> ${tokenOut.namespace}) are not supported in native single-chain router.`,
        request.url,
      );
    }

    const amountIn = BigInt(rawAmountIn);

    const candidatePaths = findRoutes(graph, tokenIn, tokenOut, { maxHops: 3, maxPaths: 20 });
    if (candidatePaths.length === 0) {
      return sendProblemDetails(
        reply,
        404,
        'No Liquidity Route Found',
        `No connected liquidity pool route exists between ${rawTokenIn} and ${rawTokenOut}.`,
        request.url,
      );
    }

    const quote = findBestQuote(candidatePaths, tokenIn, tokenOut, amountIn, { allowSplits });
    if (!quote) {
      return sendProblemDetails(
        reply,
        422,
        'Insufficient Liquidity',
        'Available liquidity along discovered routes is insufficient to fulfill the requested amount.',
        request.url,
      );
    }

    return reply.status(200).send(serializeBigInts(quote));
  });
}
