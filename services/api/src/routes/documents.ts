import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import { findDocumentById, getDocumentsForService } from '@janasahayak/db';
import { documentGuideQuerySchema, documentIdParamSchema } from '@janasahayak/validation';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface DocumentsRouteOptions {
  db: Queryable;
}

const metaJsonSchema = {
  type: 'object',
  required: ['requestId'],
  properties: {
    requestId: { type: 'string' },
  },
} as const;

const errorJsonSchema = {
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

export async function registerDocumentsRoutes(
  app: FastifyInstance,
  options: DocumentsRouteOptions,
): Promise<void> {
  const { db } = options;

  // GET /documents/:id
  app.get(
    '/documents/:id',
    {
      schema: {
        description: 'Retrieve authoritative document guide and issuing authority details',
        tags: ['Documents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Document UUID or slug identifier',
            },
          },
        },
        querystring: {
          type: 'object',
          properties: {
            returnTo: {
              type: 'string',
              description: 'Safe relative return-to path for post-guide navigation',
            },
            language: {
              type: 'string',
              enum: ['en', 'hi', 'kn'],
              description: 'Optional preferred language',
            },
          },
        },
        response: {
          200: {
            description: 'Document guide details retrieved successfully',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['id', 'name', 'description', 'documentType', 'guide'],
                properties: {
                  id: { type: 'string' },
                  name: { type: 'string' },
                  description: { type: 'string' },
                  documentType: { type: 'string' },
                  issuerId: { type: ['string', 'null'] },
                  issuer: {
                    type: ['object', 'null'],
                    properties: {
                      id: { type: 'string' },
                      name: { type: 'string' },
                      issuerType: { type: 'string' },
                      portalUrl: { type: ['string', 'null'] },
                      createdAt: { type: 'string' },
                    },
                  },
                  guide: {
                    type: 'object',
                    required: [
                      'purpose',
                      'prerequisites',
                      'issuingAuthority',
                      'processingTimeDays',
                      'fees',
                      'validityPeriod',
                      'steps',
                    ],
                    properties: {
                      purpose: { type: 'object', additionalProperties: { type: 'string' } },
                      prerequisites: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['name', 'description'],
                          properties: {
                            name: { type: 'string' },
                            description: {
                              type: 'object',
                              additionalProperties: { type: 'string' },
                            },
                          },
                        },
                      },
                      issuingAuthority: {
                        type: 'object',
                        required: ['name', 'department', 'physicalOffices'],
                        properties: {
                          name: { type: 'string' },
                          department: { type: 'string' },
                          portalUrl: { type: ['string', 'null'] },
                          physicalOffices: { type: 'string' },
                          helpline: { type: ['string', 'null'] },
                        },
                      },
                      processingTimeDays: { type: 'integer' },
                      fees: { type: 'object', additionalProperties: { type: 'string' } },
                      validityPeriod: { type: 'object', additionalProperties: { type: 'string' } },
                      steps: {
                        type: 'array',
                        items: {
                          type: 'object',
                          required: ['stepNumber', 'title', 'description'],
                          properties: {
                            stepNumber: { type: 'integer' },
                            title: { type: 'string' },
                            description: {
                              type: 'object',
                              additionalProperties: { type: 'string' },
                            },
                            officialUrl: { type: ['string', 'null'] },
                          },
                        },
                      },
                      alternativeDocuments: {
                        type: 'array',
                        items: { type: 'string' },
                      },
                    },
                  },
                  createdAt: { type: 'string' },
                  updatedAt: { type: 'string' },
                },
              },
              meta: metaJsonSchema,
            },
          },
          400: {
            description: 'Invalid document identifier or query parameters',
            ...errorJsonSchema,
          },
          404: {
            description: 'Document not found',
            ...errorJsonSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const parseResult = documentIdParamSchema.safeParse(request.params);
      if (!parseResult.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid document identifier.');
      }

      const queryResult = documentGuideQuerySchema.safeParse(request.query ?? {});
      if (!queryResult.success) {
        throw new AppError(400, 'VALIDATION_ERROR', 'Invalid query parameters.');
      }

      const { id } = parseResult.data;
      const documentDetail = await findDocumentById(db, id);

      if (!documentDetail) {
        throw new AppError(404, 'NOT_FOUND', `Document "${id}" not found.`);
      }

      return reply.send(buildSuccessResponse(documentDetail, { requestId: request.id }));
    },
  );

  // GET /services/:id/documents
  app.get(
    '/services/:id/documents',
    {
      schema: {
        description: 'Retrieve required and optional documents for a service',
        tags: ['Documents'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Service UUID or slug identifier',
            },
          },
        },
        response: {
          200: {
            description: 'Service documents checklist retrieved successfully',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: {
                  type: 'object',
                  required: [
                    'id',
                    'name',
                    'description',
                    'documentType',
                    'isRequired',
                    'displayOrder',
                  ],
                  properties: {
                    id: { type: 'string' },
                    name: { type: 'string' },
                    description: { type: 'string' },
                    documentType: { type: 'string' },
                    issuerId: { type: ['string', 'null'] },
                    isRequired: { type: 'boolean' },
                    displayOrder: { type: 'integer' },
                    conditions: { type: ['object', 'null'], additionalProperties: true },
                    createdAt: { type: 'string' },
                    updatedAt: { type: 'string' },
                  },
                },
              },
              meta: {
                type: 'object',
                required: ['requestId', 'total'],
                properties: {
                  requestId: { type: 'string' },
                  total: { type: 'integer' },
                },
              },
            },
          },
          404: {
            description: 'Service not found or has no documents configured',
            ...errorJsonSchema,
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };
      const docs = await getDocumentsForService(db, id);

      if (docs.length === 0) {
        throw new AppError(
          404,
          'NOT_FOUND',
          `Service "${id}" does not exist or has no documents configured.`,
        );
      }

      return reply.send(
        buildSuccessResponse(docs, {
          requestId: request.id,
          total: docs.length,
        }),
      );
    },
  );
}
