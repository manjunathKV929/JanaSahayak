import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import {
  getCatalogueCategories,
  getPublicServiceSources,
  getPublishedServiceBySlug,
  searchPublishedServices,
} from '@janasahayak/db';
import type { ApiErrorDetail } from '@janasahayak/types';
import {
  languageQuerySchema,
  searchServicesQuerySchema,
  serviceSlugParamSchema,
  uuidSchema,
} from '@janasahayak/validation';
import type { z } from 'zod';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface CatalogueRouteOptions {
  db: Queryable;
}

function formatZodIssues(issues: z.ZodIssue[]): ApiErrorDetail[] {
  return issues.map((issue) => {
    const detail: ApiErrorDetail = {
      message: issue.message,
    };
    if (issue.path.length > 0) {
      detail.field = issue.path.join('.');
    }
    return detail;
  });
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const paginationMetaJsonSchema = {
  type: 'object',
  required: ['requestId', 'total', 'hasMore'],
  properties: {
    requestId: { type: 'string' },
    total: { type: 'integer' },
    hasMore: { type: 'boolean' },
  },
} as const;

const publicServiceSummaryJsonSchema = {
  type: 'object',
  required: [
    'id',
    'slug',
    'serviceType',
    'title',
    'shortDescription',
    'departmentName',
    'verification',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    slug: { type: 'string' },
    serviceType: { type: 'string' },
    title: { type: 'string' },
    shortDescription: { type: 'string' },
    departmentName: { type: 'string' },
    stateCode: { type: ['string', 'null'] },
    verification: {
      type: 'object',
      required: ['status', 'lastVerifiedAt'],
      properties: {
        status: { type: 'string' },
        lastVerifiedAt: { type: 'string', format: 'date-time' },
      },
    },
  },
} as const;

const publicSourceJsonSchema = {
  type: 'object',
  required: [
    'id',
    'serviceId',
    'sourceUrl',
    'sourceType',
    'publisher',
    'verificationStatus',
    'lastVerifiedAt',
    'retrievedAt',
  ],
  properties: {
    id: { type: 'string', format: 'uuid' },
    serviceId: { type: 'string', format: 'uuid' },
    sourceUrl: { type: 'string', format: 'uri' },
    sourceType: { type: 'string' },
    publisher: { type: 'string' },
    verificationStatus: { type: 'string' },
    lastVerifiedAt: { type: 'string', format: 'date-time' },
    retrievedAt: { type: 'string', format: 'date-time' },
  },
} as const;

export async function registerCatalogueRoutes(
  app: FastifyInstance,
  options: CatalogueRouteOptions,
): Promise<void> {
  const { db } = options;

  // 1. GET /services - Public search & browse
  app.get(
    '/services',
    {
      schema: {
        tags: ['Public Catalogue'],
        summary: 'Search and browse published services',
        description:
          'Returns a paginated list of published services matching optional query, category, or state filters.',
        querystring: {
          type: 'object',
          properties: {
            q: { type: 'string', maxLength: 100 },
            category: { type: 'string', maxLength: 50 },
            state: { type: 'string', pattern: '^[A-Z]{2}$' },
            language: { type: 'string', enum: ['en', 'hi', 'kn'], default: 'en' },
            limit: { type: 'integer', minimum: 1, maximum: 100, default: 20 },
            offset: { type: 'integer', minimum: 0, default: 0 },
            cursor: { type: 'string' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: publicServiceSummaryJsonSchema,
              },
              meta: paginationMetaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = searchServicesQuerySchema.safeParse(request.query);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid search query parameters.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const result = await searchPublishedServices(db, {
        q: parsed.data.q,
        category: parsed.data.category,
        state: parsed.data.state,
        language: parsed.data.language,
        limit: parsed.data.limit,
        offset: parsed.data.offset,
      });

      return reply.send(
        buildSuccessResponse(result.services, {
          requestId: request.id,
          total: result.total,
          hasMore: result.hasMore,
        }),
      );
    },
  );

  // 2. GET /services/:slug - Public service detail by slug
  app.get(
    '/services/:slug',
    {
      schema: {
        tags: ['Public Catalogue'],
        summary: 'Get published service details by slug',
        description:
          'Returns full public service guidance including plain-language overview, required documents, eligibility rules, and official portal links.',
        params: {
          type: 'object',
          required: ['slug'],
          properties: {
            slug: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$' },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            language: { type: 'string', enum: ['en', 'hi', 'kn'] },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: [
                  'service',
                  'version',
                  'sources',
                  'documents',
                  'rules',
                  'journey',
                  'deadlines',
                ],
                properties: {
                  service: {
                    type: 'object',
                    required: [
                      'id',
                      'slug',
                      'serviceType',
                      'title',
                      'shortDescription',
                      'departmentName',
                      'status',
                    ],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      slug: { type: 'string' },
                      serviceType: { type: 'string' },
                      title: { type: 'string' },
                      shortDescription: { type: 'string' },
                      departmentName: { type: 'string' },
                      stateCode: { type: ['string', 'null'] },
                      status: { type: 'string' },
                      currentVersionId: { type: ['string', 'null'], format: 'uuid' },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  version: {
                    type: ['object', 'null'],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      serviceId: { type: 'string', format: 'uuid' },
                      versionNumber: { type: 'integer' },
                      content: { type: 'object', additionalProperties: true },
                      language: { type: 'string' },
                      effectiveFrom: { type: ['string', 'null'] },
                      effectiveTo: { type: ['string', 'null'] },
                      createdAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  sources: {
                    type: 'array',
                    items: publicSourceJsonSchema,
                  },
                  documents: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'name', 'description', 'documentType'],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        description: { type: 'string' },
                        documentType: { type: 'string' },
                        issuerId: { type: ['string', 'null'], format: 'uuid' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  rules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: [
                        'id',
                        'serviceId',
                        'name',
                        'ruleExpression',
                        'explanation',
                        'priority',
                      ],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        serviceId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        ruleExpression: { type: 'object' },
                        explanation: { type: 'object' },
                        priority: { type: 'integer' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                      },
                    },
                  },
                  journey: {
                    type: ['object', 'null'],
                    properties: {
                      id: { type: 'string', format: 'uuid' },
                      serviceId: { type: 'string', format: 'uuid' },
                      title: { type: 'string' },
                      description: { type: 'string' },
                      version: { type: 'integer' },
                      steps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: [
                            'id',
                            'journeyId',
                            'stepKey',
                            'title',
                            'description',
                            'stepType',
                            'displayOrder',
                          ],
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            journeyId: { type: 'string', format: 'uuid' },
                            stepKey: { type: 'string' },
                            title: { type: 'string' },
                            description: { type: 'object' },
                            stepType: { type: 'string' },
                            displayOrder: { type: 'integer' },
                            officialUrl: { type: ['string', 'null'], format: 'uri' },
                            completionRule: { type: ['object', 'null'] },
                          },
                        },
                      },
                      createdAt: { type: 'string', format: 'date-time' },
                      updatedAt: { type: 'string', format: 'date-time' },
                    },
                  },
                  deadlines: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'serviceId', 'name', 'status'],
                      properties: {
                        id: { type: 'string', format: 'uuid' },
                        serviceId: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        opensAt: { type: ['string', 'null'], format: 'date-time' },
                        closesAt: { type: ['string', 'null'], format: 'date-time' },
                        sourceId: { type: ['string', 'null'], format: 'uuid' },
                        status: { type: 'string' },
                      },
                    },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = serviceSlugParamSchema.safeParse(request.params);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid service slug parameter.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const queryParsed = languageQuerySchema.safeParse(request.query);
      const language = queryParsed.success ? queryParsed.data.language : undefined;

      const detail = await getPublishedServiceBySlug(db, parsed.data.slug, language);
      if (!detail) {
        throw new AppError(404, 'NOT_FOUND', 'Service not found.');
      }

      return reply.send(buildSuccessResponse(detail, { requestId: request.id }));
    },
  );

  // 3. GET /services/:id/sources - Public provenance metadata
  app.get(
    '/services/:id/sources',
    {
      schema: {
        tags: ['Public Catalogue'],
        summary: 'Get public source provenance for a service',
        description: 'Returns official source metadata for displaying provenance and authenticity.',
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: { type: 'string', format: 'uuid' },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: publicSourceJsonSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const params = request.params as { id?: string };
      const parsed = uuidSchema.safeParse(params.id);
      if (!parsed.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid service ID format.');
      }

      const sources = await getPublicServiceSources(db, parsed.data);
      return reply.send(buildSuccessResponse(sources, { requestId: request.id }));
    },
  );

  // 4. GET /categories - Browse distinct categories
  app.get(
    '/categories',
    {
      schema: {
        tags: ['Public Catalogue'],
        summary: 'Get service categories with counts',
        description: 'Returns available service categories from published catalogue records.',
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  required: ['category', 'count'],
                  properties: {
                    category: { type: 'string' },
                    count: { type: 'integer' },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const categories = await getCatalogueCategories(db);
      return reply.send(buildSuccessResponse(categories, { requestId: request.id }));
    },
  );
}
