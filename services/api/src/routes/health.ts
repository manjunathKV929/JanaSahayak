import type { FastifyInstance } from 'fastify';
import type { HealthCheckPayload, ReadinessCheckPayload } from '@janasahayak/types';
import { buildErrorResponse, buildSuccessResponse } from '../errors.js';

export interface HealthRouteOptions {
  serviceName: string;
  version: string;
  checkDatabase: () => Promise<'up' | 'down' | 'not_configured'>;
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const errorEnvelopeJsonSchema = {
  type: 'object',
  required: ['error', 'meta'],
  properties: {
    error: {
      type: 'object',
      required: ['code', 'message', 'details'],
      properties: {
        code: { type: 'string' },
        message: { type: 'string' },
        details: {
          type: 'array',
          items: {
            type: 'object',
            required: ['message'],
            properties: {
              field: { type: 'string' },
              message: { type: 'string' },
              code: { type: 'string' },
            },
          },
        },
      },
    },
    meta: metaJsonSchema,
  },
} as const;

export async function registerHealthRoutes(
  app: FastifyInstance,
  options: HealthRouteOptions,
): Promise<void> {
  app.get(
    '/health',
    {
      schema: {
        tags: ['System'],
        summary: 'API liveness probe',
        description: 'Returns service liveness metadata.',
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['status', 'service', 'version', 'timestamp'],
                properties: {
                  status: { type: 'string', enum: ['ok'] },
                  service: { type: 'string' },
                  version: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      const payload: HealthCheckPayload = {
        status: 'ok',
        service: options.serviceName,
        version: options.version,
        timestamp: new Date().toISOString(),
      };
      return buildSuccessResponse(payload, { requestId: request.id });
    },
  );

  app.get(
    '/ready',
    {
      schema: {
        tags: ['System'],
        summary: 'API readiness probe',
        description: 'Checks whether the API and required backing dependencies are ready.',
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['status', 'service', 'version', 'timestamp', 'checks'],
                properties: {
                  status: { type: 'string', enum: ['ready', 'not_ready'] },
                  service: { type: 'string' },
                  version: { type: 'string' },
                  timestamp: { type: 'string', format: 'date-time' },
                  checks: {
                    type: 'object',
                    required: ['database'],
                    properties: {
                      database: { type: 'string', enum: ['up', 'down', 'not_configured'] },
                    },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
          503: errorEnvelopeJsonSchema,
        },
      },
    },
    async (request, reply) => {
      reply.header('Cache-Control', 'no-store');
      let databaseStatus: 'up' | 'down' | 'not_configured';
      try {
        databaseStatus = await options.checkDatabase();
      } catch {
        databaseStatus = 'down';
      }

      if (databaseStatus === 'down') {
        return reply
          .code(503)
          .send(
            buildErrorResponse(
              'SERVICE_UNAVAILABLE',
              'Database dependency is unavailable.',
              request.id,
              [{ field: 'database', message: 'PostgreSQL health check failed' }],
            ),
          );
      }

      const payload: ReadinessCheckPayload = {
        status: 'ready',
        service: options.serviceName,
        version: options.version,
        timestamp: new Date().toISOString(),
        checks: {
          database: databaseStatus,
        },
      };
      return buildSuccessResponse(payload, { requestId: request.id });
    },
  );
}
