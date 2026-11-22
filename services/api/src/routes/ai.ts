import type { FastifyInstance } from 'fastify';
import { RAGService } from '@janasahayak/ai';
import type { Queryable } from '@janasahayak/db';
import { getPublishedServiceBySlug, searchPublishedServices } from '@janasahayak/db';
import type { ApiErrorDetail, PublicServiceDetail, SupportedLanguage } from '@janasahayak/types';
import { aiAssistBodySchema, searchInterpretationBodySchema } from '@janasahayak/validation';
import type { z } from 'zod';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface AIRouteOptions {
  db: Queryable;
  ragService?: RAGService | undefined;
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

export async function registerAIRoutes(
  app: FastifyInstance,
  options: AIRouteOptions,
): Promise<void> {
  const { db } = options;
  const ragService = options.ragService ?? new RAGService();

  // POST /search/interpret
  app.post(
    '/search/interpret',
    {
      schema: {
        description:
          'Natural language search query interpretation with civic intent classification, PII redaction, and suggested clarifying questions.',
        tags: ['AI Assistant'],
        body: {
          type: 'object',
          required: ['query'],
          properties: {
            query: { type: 'string', minLength: 1, maxLength: 500 },
            language: { type: 'string', enum: ['en', 'hi', 'kn'] },
          },
        },
        response: {
          200: {
            description: 'Search interpretation result with matched services and suggestions',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: [
                  'intent',
                  'confidence',
                  'suggestedQuestions',
                  'matches',
                  'sanitizedQuery',
                  'piiDetected',
                ],
                properties: {
                  intent: { type: 'string' },
                  confidence: { type: 'number' },
                  suggestedQuestions: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  matches: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'slug', 'title', 'summary', 'confidence', 'verification'],
                      properties: {
                        id: { type: 'string' },
                        slug: { type: 'string' },
                        title: { type: 'string' },
                        summary: { type: 'string' },
                        confidence: { type: 'number' },
                        verification: {
                          type: 'object',
                          required: ['status'],
                          properties: {
                            status: { type: 'string' },
                            lastVerifiedAt: { type: 'string' },
                          },
                        },
                      },
                    },
                  },
                  sanitizedQuery: { type: 'string' },
                  piiDetected: { type: 'boolean' },
                },
              },
              meta: metaJsonSchema,
            },
          },
          400: {
            description: 'Invalid search interpretation request',
            type: 'object',
            required: ['error', 'meta'],
            properties: {
              error: {
                type: 'object',
                required: ['code', 'message'],
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
      const parsed = searchInterpretationBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Search interpretation request is invalid.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const language: SupportedLanguage = parsed.data.language ?? 'en';

      let availableServices: PublicServiceDetail[] = [];
      try {
        const searchResult = await searchPublishedServices(db, { limit: 10, language });
        const details = await Promise.all(
          searchResult.services.map((s) => getPublishedServiceBySlug(db, s.slug, language)),
        );
        availableServices = details.filter((d): d is PublicServiceDetail => d !== null);
      } catch {
        // If DB query fails or unconfigured, proceed with empty candidate list
        availableServices = [];
      }

      const interpretation = ragService.interpretSearch(
        parsed.data.query,
        language,
        availableServices,
      );

      return reply.code(200).send(buildSuccessResponse(interpretation, { requestId: request.id }));
    },
  );

  // POST /ai/assist
  app.post(
    '/ai/assist',
    {
      schema: {
        description:
          'Grounded AI assistance for citizen queries, bounded strictly by official government records with source citations and conservative refusal.',
        tags: ['AI Assistant'],
        body: {
          type: 'object',
          required: ['message'],
          properties: {
            message: { type: 'string', minLength: 1, maxLength: 1000 },
            language: { type: 'string', enum: ['en', 'hi', 'kn'] },
            context: {
              type: 'object',
              properties: {
                serviceId: { type: 'string' },
                serviceSlug: { type: 'string' },
              },
            },
          },
        },
        response: {
          200: {
            description: 'Grounded assistant answer with official source citations',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['answer', 'sources', 'refusal', 'suggestedActions'],
                properties: {
                  answer: { type: 'string' },
                  sources: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['serviceId', 'sourceId', 'sourceUrl', 'verificationStatus'],
                      properties: {
                        serviceId: { type: 'string' },
                        sourceId: { type: 'string' },
                        sourceUrl: { type: 'string' },
                        verificationStatus: { type: 'string' },
                      },
                    },
                  },
                  refusal: { type: 'boolean' },
                  suggestedActions: {
                    type: 'array',
                    items: { type: 'string' },
                  },
                  model: { type: 'string' },
                },
              },
              meta: metaJsonSchema,
            },
          },
          400: {
            description: 'Invalid AI assist request',
            type: 'object',
            required: ['error', 'meta'],
            properties: {
              error: {
                type: 'object',
                required: ['code', 'message'],
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
      const parsed = aiAssistBodySchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'AI assist request is invalid.',
          formatZodIssues(parsed.error.issues),
        );
      }

      const language: SupportedLanguage = parsed.data.language ?? 'en';
      let serviceDetail: PublicServiceDetail | null = null;

      const targetIdentifier = parsed.data.context?.serviceId ?? parsed.data.context?.serviceSlug;
      if (targetIdentifier) {
        try {
          serviceDetail = await getPublishedServiceBySlug(db, targetIdentifier, language);
        } catch {
          serviceDetail = null;
        }
      }

      const assistResult = await ragService.assist({
        message: parsed.data.message,
        language,
        service: serviceDetail,
      });

      return reply.code(200).send(buildSuccessResponse(assistResult, { requestId: request.id }));
    },
  );
}
