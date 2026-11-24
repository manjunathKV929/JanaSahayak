import type { FastifyInstance } from 'fastify';
import { defaultMetricsRegistry, type MetricsRegistry } from '../metrics.js';

export interface MetricsRouteOptions {
  registry?: MetricsRegistry;
}

export async function registerMetricsRoutes(
  app: FastifyInstance,
  options: MetricsRouteOptions = {},
): Promise<void> {
  const registry = options.registry ?? defaultMetricsRegistry;

  app.get(
    '/metrics',
    {
      schema: {
        tags: ['System'],
        summary: 'Prometheus metrics exporter',
        description: 'Returns application and runtime metrics in Prometheus text format 0.0.4.',
        response: {
          200: {
            type: 'string',
            description: 'Prometheus metrics text format',
          },
        },
      },
    },
    async (_request, reply) => {
      reply.header('Content-Type', 'text/plain; version=0.0.4; charset=utf-8');
      reply.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
      return reply.send(registry.renderPrometheusText());
    },
  );
}
