import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import { getDeadlinesForService, listDeadlines } from '@janasahayak/db';
import { deadlineQuerySchema } from '@janasahayak/validation';
import { buildSuccessResponse } from '../errors.js';

export interface DeadlinesRouteOptions {
  db: Queryable;
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const deadlineItemSchema = {
  type: 'object',
  required: ['id', 'serviceId', 'serviceSlug', 'serviceTitle', 'category', 'name', 'status'],
  properties: {
    id: { type: 'string' },
    serviceId: { type: 'string' },
    serviceSlug: { type: 'string' },
    serviceTitle: { type: 'string' },
    category: { type: 'string' },
    stateCode: { type: 'string', nullable: true },
    name: { type: 'string' },
    opensAt: { type: 'string', nullable: true },
    closesAt: { type: 'string', nullable: true },
    daysRemaining: { type: 'integer', nullable: true },
    status: {
      type: 'string',
      enum: ['UPCOMING', 'OPEN', 'CLOSING_SOON', 'EXPIRED'],
    },
    sourceUrl: { type: 'string', nullable: true },
    sourcePublisher: { type: 'string', nullable: true },
    lastVerifiedAt: { type: 'string', nullable: true },
  },
} as const;

export async function registerDeadlinesRoutes(
  app: FastifyInstance,
  options: DeadlinesRouteOptions,
): Promise<void> {
  const { db } = options;

  // GET /deadlines
  app.get(
    '/deadlines',
    {
      schema: {
        description: 'List tracked public service deadlines with urgency status and provenance',
        tags: ['Deadlines'],
        querystring: {
          type: 'object',
          properties: {
            state: { type: 'string' },
            category: { type: 'string' },
            status: {
              type: 'string',
              enum: ['ALL', 'OPEN', 'CLOSING_SOON', 'EXPIRED', 'UPCOMING'],
              default: 'ALL',
            },
            from: { type: 'string', format: 'date-time' },
            to: { type: 'string', format: 'date-time' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 50 },
            offset: { type: 'integer', minimum: 0, default: 0 },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: deadlineItemSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const query = deadlineQuerySchema.parse(request.query);
      const deadlines = await listDeadlines(db, query);
      return buildSuccessResponse(deadlines, { requestId: request.id });
    },
  );

  // GET /services/:id/deadlines
  app.get(
    '/services/:id/deadlines',
    {
      schema: {
        description: 'Get verified deadlines for a specific service by ID or slug',
        tags: ['Deadlines'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: deadlineItemSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const { id } = request.params as { id: string };
      const deadlines = await getDeadlinesForService(db, id);
      return buildSuccessResponse(deadlines, { requestId: request.id });
    },
  );
}
