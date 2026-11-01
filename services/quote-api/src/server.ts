import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import { PoolGraph } from '@omnifi/quote-engine';
import Fastify, { FastifyInstance } from 'fastify';
import { sendProblemDetails } from './errors/problem-details';
import { createDefaultGraph } from './registry/default-pools';
import { registerQuoteRoutes } from './routes/quotes';
import { registerRoutesDiscovery } from './routes/routes';
import { registerSimulateRoutes } from './routes/simulate';
import { registerNetworksRoutes } from './routes/networks';
import { registerTokensRoutes } from './routes/tokens';
import { registerPoolsRoutes } from './routes/pools';
import { registerPositionsRoutes } from './routes/positions';
import { registerPrepareRoutes } from './routes/prepare';
import { registerAnalyticsRoutes } from './routes/analytics';
import { register, httpRequestDurationSeconds, httpRequestsTotal } from './metrics';

export interface BuildServerOptions {
  graph?: PoolGraph;
  enableRateLimit?: boolean;
}

export async function buildServer(options: BuildServerOptions = {}): Promise<FastifyInstance> {
  const fastify = Fastify({
    logger: false,
  });

  // CORS
  await fastify.register(cors, {
    origin: '*',
    methods: ['GET', 'POST', 'OPTIONS'],
  });

  // Rate Limiting (Token-Bucket / sliding window)
  if (options.enableRateLimit !== false) {
    await fastify.register(rateLimit, {
      max: 100,
      timeWindow: '1 minute',
      errorResponseBuilder: (request, context) => {
        return {
          type: 'https://omnifi.finance/errors/429',
          title: 'Too Many Requests',
          status: 429,
          detail: `Rate limit of ${context.max} requests per ${context.after} exceeded.`,
          instance: request.url,
        };
      },
    });
  }

  // Global error handler for uncaught exceptions -> RFC 7807
  fastify.setErrorHandler((error, request, reply) => {
    return sendProblemDetails(
      reply,
      error.statusCode ?? 500,
      error.name ?? 'Internal Server Error',
      error.message ?? 'An unexpected error occurred processing your request.',
      request.url,
    );
  });

  // Prometheus Metrics Hook
  fastify.addHook('onRequest', async (request: any) => {
    request.startTime = performance.now();
  });

  fastify.addHook('onResponse', async (request: any, reply) => {
    if (request.startTime) {
      const duration = (performance.now() - request.startTime) / 1000;
      const route = request.routeOptions?.url || request.url.split('?')[0];
      httpRequestDurationSeconds.observe({ method: request.method, route }, duration);
      httpRequestsTotal.inc({ method: request.method, route, status: reply.statusCode.toString() });
    }
  });

  // Health check
  fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: Date.now() };
  });

  // Prometheus /metrics endpoint
  fastify.get('/metrics', async (request, reply) => {
    reply.header('Content-Type', register.contentType);
    return register.metrics();
  });

  const graph = options.graph ?? createDefaultGraph();

  // Register API routes
  registerNetworksRoutes(fastify);
  registerTokensRoutes(fastify);
  registerPoolsRoutes(fastify, graph);
  registerPositionsRoutes(fastify, graph);
  registerPrepareRoutes(fastify);
  registerAnalyticsRoutes(fastify, graph);
  registerQuoteRoutes(fastify, graph);
  registerRoutesDiscovery(fastify, graph);
  registerSimulateRoutes(fastify);

  return fastify;
}

export async function start() {
  const server = await buildServer();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3001;
  const host = process.env.HOST ?? '0.0.0.0';

  try {
    await server.listen({ port, host });
    console.log(`OmniFi Quote API listening on http://${host}:${port}`);
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
}

if (process.env.NODE_ENV !== 'test' && require.main === module) {
  start();
}

