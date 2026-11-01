import { parseAssetRef } from '@omnifi/domain';
import { findBestQuote, findRoutes, PoolGraph } from '@omnifi/quote-engine';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import { sendProblemDetails } from '../errors/problem-details';
import { QuoteQuerySchema } from '../validation/schemas';
import { quoteLatencySeconds, quoteRequestsTotal } from '../metrics';

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

const PostQuoteBodySchema = z.object({
  tokenIn: z.string(),
  tokenOut: z.string(),
  amount: z.string(),
  exactIn: z.boolean().default(true),
  allowSplits: z.boolean().default(false),
});

export function registerQuoteRoutes(fastify: FastifyInstance, graph: PoolGraph) {
  // GET /api/v1/quotes
  fastify.get('/api/v1/quotes', async (request: FastifyRequest, reply: FastifyReply) => {
    const start = performance.now();
    const parseResult = QuoteQuerySchema.safeParse(request.query);
    if (!parseResult.success) {
      quoteRequestsTotal.inc({ status: 'bad_request' });
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
      quoteRequestsTotal.inc({ status: 'cross_chain_unsupported' });
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
      quoteRequestsTotal.inc({ status: 'no_route' });
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
      quoteRequestsTotal.inc({ status: 'insufficient_liquidity' });
      return sendProblemDetails(
        reply,
        422,
        'Insufficient Liquidity',
        'Available liquidity along discovered routes is insufficient to fulfill the requested amount.',
        request.url,
      );
    }

    const duration = (performance.now() - start) / 1000;
    quoteLatencySeconds.observe(duration);
    quoteRequestsTotal.inc({ status: 'success' });

    return reply.status(200).send(serializeBigInts(quote));
  });

  // POST /quote and POST /api/v1/quote
  const handlePostQuote = async (request: FastifyRequest, reply: FastifyReply) => {
    const start = performance.now();
    const parseResult = PostQuoteBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      quoteRequestsTotal.inc({ status: 'bad_request' });
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Body',
        parseResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join(', '),
        request.url,
      );
    }

    const { tokenIn: rawTokenIn, tokenOut: rawTokenOut, amount: rawAmount, allowSplits } = parseResult.data;

    // Helper to normalize address to AssetRef
    const resolveAssetRef = (raw: string) => {
      if (raw.includes(':')) {
        return parseAssetRef(raw);
      }
      // If pure address, search pool graph tokens
      for (const p of graph.allPools()) {
        if (p.token0.address.toLowerCase() === raw.toLowerCase()) return p.token0;
        if (p.token1.address.toLowerCase() === raw.toLowerCase()) return p.token1;
      }
      return null;
    };

    const tokenIn = resolveAssetRef(rawTokenIn);
    const tokenOut = resolveAssetRef(rawTokenOut);

    if (!tokenIn || !tokenOut) {
      quoteRequestsTotal.inc({ status: 'token_not_found' });
      return sendProblemDetails(
        reply,
        404,
        'Asset Not Found',
        `Could not resolve asset metadata for ${rawTokenIn} or ${rawTokenOut}.`,
        request.url,
      );
    }

    const amountIn = BigInt(rawAmount);
    const candidatePaths = findRoutes(graph, tokenIn, tokenOut, { maxHops: 3, maxPaths: 20 });
    if (candidatePaths.length === 0) {
      quoteRequestsTotal.inc({ status: 'no_route' });
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
      quoteRequestsTotal.inc({ status: 'insufficient_liquidity' });
      return sendProblemDetails(
        reply,
        422,
        'Insufficient Liquidity',
        'Available liquidity along discovered routes is insufficient to fulfill the requested amount.',
        request.url,
      );
    }

    const duration = (performance.now() - start) / 1000;
    quoteLatencySeconds.observe(duration);
    quoteRequestsTotal.inc({ status: 'success' });

    return reply.status(200).send({
      ...serializeBigInts(quote),
      tokenIn: rawTokenIn,
      tokenOut: rawTokenOut,
      amountIn: quote.amountIn.toString(),
      amountOut: quote.amountOut.toString(),
      executionPrice: quote.executionPrice,
      priceImpactBps: quote.priceImpact.bps,
      estimatedGasOrFee: '250000',
    });
  };

  fastify.post('/quote', handlePostQuote);
  fastify.post('/api/v1/quote', handlePostQuote);
}
