import { TransactionIntent } from '@omnifi/domain';
import { simulateEvmCall, simulateSolanaIntent } from '@omnifi/quote-engine';
import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { sendProblemDetails } from '../errors/problem-details';
import { SimulateBodySchema } from '../validation/schemas';

export function registerSimulateRoutes(fastify: FastifyInstance) {
  fastify.post('/api/v1/simulate', async (request: FastifyRequest, reply: FastifyReply) => {
    const parseResult = SimulateBodySchema.safeParse(request.body);
    if (!parseResult.success) {
      const invalidParams = parseResult.error.errors.map((e) => ({
        name: e.path.join('.'),
        reason: e.message,
      }));
      return sendProblemDetails(
        reply,
        400,
        'Invalid Request Body',
        'Transaction intent payload failed schema validation.',
        request.url,
        invalidParams,
      );
    }

    const { intent, rpcUrl } = parseResult.data;

    if (intent.namespace === 'eip155') {
      const defaultRpc = rpcUrl ?? 'http://127.0.0.1:8545';
      const sender = '0x0000000000000000000000000000000000000001' as `0x${string}`;

      const sim = await simulateEvmCall(defaultRpc, sender, intent as unknown as TransactionIntent);
      return reply.status(200).send({
        intentId: intent.intentId,
        namespace: intent.namespace,
        success: sim.success,
        gasUsed: sim.gasUsed ? sim.gasUsed.toString() : '150000',
        error: sim.error,
      });
    }

    if (intent.namespace === 'solana') {
      const defaultRpc = rpcUrl ?? 'http://127.0.0.1:8899';
      const sim = await simulateSolanaIntent(defaultRpc, intent as unknown as TransactionIntent);
      return reply.status(200).send({
        intentId: intent.intentId,
        namespace: intent.namespace,
        success: sim.success,
        unitsConsumed: sim.unitsConsumed ?? 200_000,
        logs: sim.logs ?? [],
        error: sim.error,
      });
    }

    return sendProblemDetails(
      reply,
      400,
      'Unsupported Namespace',
      `Simulation for namespace ${intent.namespace} is not supported.`,
      request.url,
    );
  });
}
