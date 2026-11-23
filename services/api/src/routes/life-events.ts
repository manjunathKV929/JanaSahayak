import type { FastifyInstance } from 'fastify';
import { getLifeEventByKey, listLifeEvents } from '@janasahayak/db';
import type { LifeEventKey } from '@janasahayak/types';
import { lifeEventKeyEnum, lifeEventQuerySchema } from '@janasahayak/validation';
import { AppError, buildSuccessResponse } from '../errors.js';

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const lifeEventItemSchema = {
  type: 'object',
  required: ['id', 'key', 'title', 'description', 'icon', 'order', 'serviceBundles'],
  properties: {
    id: { type: 'string' },
    key: {
      type: 'string',
      enum: [
        'EDUCATION_HIGHER',
        'CHILDBIRTH_MATERNITY',
        'EMPLOYMENT_LIVELIHOOD',
        'SENIOR_RETIREMENT',
        'BEREAVEMENT_SURVIVOR',
      ],
    },
    title: { type: 'object', additionalProperties: { type: 'string' } },
    description: { type: 'object', additionalProperties: { type: 'string' } },
    icon: { type: 'string' },
    order: { type: 'integer' },
    serviceBundles: {
      type: 'array',
      items: {
        type: 'object',
        required: [
          'serviceId',
          'slug',
          'title',
          'category',
          'importance',
          'typicalTimeline',
          'requiredDocuments',
        ],
        properties: {
          serviceId: { type: 'string' },
          slug: { type: 'string' },
          title: { type: 'string' },
          category: { type: 'string' },
          importance: { type: 'string', enum: ['CRITICAL', 'RECOMMENDED', 'OPTIONAL'] },
          typicalTimeline: { type: 'string' },
          requiredDocuments: { type: 'array', items: { type: 'string' } },
        },
      },
    },
  },
} as const;

export async function registerLifeEventsRoutes(app: FastifyInstance): Promise<void> {
  // GET /life-events
  app.get(
    '/life-events',
    {
      schema: {
        description:
          'List curated citizen life-event bundles (higher ed, maternity, retirement, etc.)',
        tags: ['Life Events'],
        querystring: {
          type: 'object',
          properties: {
            key: {
              type: 'string',
              enum: [
                'EDUCATION_HIGHER',
                'CHILDBIRTH_MATERNITY',
                'EMPLOYMENT_LIVELIHOOD',
                'SENIOR_RETIREMENT',
                'BEREAVEMENT_SURVIVOR',
              ],
            },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: lifeEventItemSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const query = lifeEventQuerySchema.parse(request.query);
      if (query.key) {
        const item = getLifeEventByKey(query.key);
        return buildSuccessResponse(item ? [item] : [], { requestId: request.id });
      }
      const events = listLifeEvents();
      return buildSuccessResponse(events, { requestId: request.id });
    },
  );

  // GET /life-events/:key
  app.get(
    '/life-events/:key',
    {
      schema: {
        description: 'Get life-event service bundle and timeline details by transition key',
        tags: ['Life Events'],
        params: {
          type: 'object',
          required: ['key'],
          properties: {
            key: {
              type: 'string',
            },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: lifeEventItemSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request) => {
      const { key } = request.params as { key: string };
      const parsedKey = lifeEventKeyEnum.safeParse(key);
      if (!parsedKey.success) {
        throw new AppError(404, 'NOT_FOUND', `Life event key '${key}' not found.`);
      }

      const event = getLifeEventByKey(parsedKey.data as LifeEventKey);
      if (!event) {
        throw new AppError(404, 'NOT_FOUND', `Life event '${key}' does not exist.`);
      }

      return buildSuccessResponse(event, { requestId: request.id });
    },
  );
}
