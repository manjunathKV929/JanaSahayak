import type { FastifyInstance } from 'fastify';
import type { Queryable } from '@janasahayak/db';
import { getEligibilityForService } from '@janasahayak/db';
import type { ApiErrorDetail } from '@janasahayak/types';
import {
  evaluateEligibility,
  evaluateEligibilityRequestSchema,
} from '@janasahayak/validation';
import type { z } from 'zod';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface EligibilityRouteOptions {
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

export async function registerEligibilityRoutes(
  app: FastifyInstance,
  options: EligibilityRouteOptions,
): Promise<void> {
  const { db } = options;

  // GET /services/:id/eligibility/questions
  app.get(
    '/services/:id/eligibility/questions',
    {
      schema: {
        description: 'Retrieve the deterministic eligibility questionnaire for a service',
        tags: ['Eligibility'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Service UUID or kebab-case slug identifier',
            },
          },
        },
        response: {
          200: {
            description: 'Eligibility questionnaire retrieved successfully',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['serviceIdentifier', 'questions'],
                properties: {
                  serviceIdentifier: { type: 'string' },
                  questions: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['id', 'key', 'questionText', 'answerType', 'required', 'displayOrder', 'options'],
                      properties: {
                        id: { type: 'string' },
                        key: { type: 'string' },
                        questionText: { type: 'object', additionalProperties: { type: 'string' } },
                        answerType: {
                          type: 'string',
                          enum: ['text', 'number', 'boolean', 'single_choice', 'multi_choice'],
                        },
                        required: { type: 'boolean' },
                        displayOrder: { type: 'integer' },
                        options: {
                          type: 'array',
                          items: {
                            type: 'object',
                            required: ['id', 'key', 'label', 'displayOrder'],
                            properties: {
                              id: { type: 'string' },
                              key: { type: 'string' },
                              label: { type: 'object', additionalProperties: { type: 'string' } },
                              displayOrder: { type: 'integer' },
                            },
                          },
                        },
                      },
                    },
                  },
                },
              },
              meta: metaJsonSchema,
            },
          },
          404: {
            description: 'Service not found or no questions configured',
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const bundle = await getEligibilityForService(db, id);

      if (bundle.questions.length === 0 && bundle.rules.length === 0) {
        throw new AppError(
          404,
          'SERVICE_NOT_FOUND',
          `Service "${id}" does not exist or has no eligibility criteria configured.`,
        );
      }

      return reply.send(
        buildSuccessResponse(
          {
            serviceIdentifier: id,
            questions: bundle.questions,
          },
          { requestId: request.id },
        ),
      );
    },
  );

  // POST /services/:id/eligibility/evaluate
  app.post(
    '/services/:id/eligibility/evaluate',
    {
      schema: {
        description: 'Deterministically evaluate citizen answers against official service eligibility rules',
        tags: ['Eligibility'],
        params: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Service UUID or kebab-case slug identifier',
            },
          },
        },
        body: {
          type: 'object',
          required: ['answers'],
          properties: {
            answers: {
              type: 'object',
              additionalProperties: true,
              description: 'Citizen answers mapped by question key',
            },
            language: {
              type: 'string',
              enum: ['en', 'hi', 'kn'],
              description: 'Preferred language for explanation output',
            },
          },
        },
        response: {
          200: {
            description: 'Deterministic evaluation result',
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'object',
                required: ['result', 'matchedRules', 'unmatchedRules', 'missingFields', 'explanations', 'disclaimer'],
                properties: {
                  result: {
                    type: 'string',
                    enum: ['POTENTIALLY_ELIGIBLE', 'UNLIKELY_ELIGIBLE', 'INCOMPLETE_INFO'],
                  },
                  matchedRules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['ruleId', 'ruleName', 'status', 'explanation', 'missingFields'],
                      properties: {
                        ruleId: { type: 'string' },
                        ruleName: { type: 'string' },
                        status: { type: 'string' },
                        explanation: { type: 'string' },
                        reason: { type: 'string' },
                        missingFields: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                  unmatchedRules: {
                    type: 'array',
                    items: {
                      type: 'object',
                      required: ['ruleId', 'ruleName', 'status', 'explanation', 'missingFields'],
                      properties: {
                        ruleId: { type: 'string' },
                        ruleName: { type: 'string' },
                        status: { type: 'string' },
                        explanation: { type: 'string' },
                        reason: { type: 'string' },
                        missingFields: { type: 'array', items: { type: 'string' } },
                      },
                    },
                  },
                  missingFields: { type: 'array', items: { type: 'string' } },
                  explanations: { type: 'array', items: { type: 'string' } },
                  disclaimer: { type: 'string' },
                },
              },
              meta: metaJsonSchema,
            },
          },
          400: {
            description: 'Invalid answer payload',
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
          404: {
            description: 'Service not found',
            type: 'object',
            properties: {
              error: {
                type: 'object',
                properties: {
                  code: { type: 'string' },
                  message: { type: 'string' },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      const { id } = request.params as { id: string };

      const parseResult = evaluateEligibilityRequestSchema.safeParse(request.body);
      if (!parseResult.success) {
        throw new AppError(
          400,
          'INVALID_INPUT',
          'Invalid eligibility answers payload.',
          formatZodIssues(parseResult.error.issues),
        );
      }

      const { answers, language } = parseResult.data;

      const bundle = await getEligibilityForService(db, id);

      if (bundle.questions.length === 0 && bundle.rules.length === 0) {
        throw new AppError(
          404,
          'SERVICE_NOT_FOUND',
          `Service "${id}" does not exist or has no eligibility criteria configured.`,
        );
      }

      const evaluation = evaluateEligibility({
        rules: bundle.rules,
        answers,
        language: language ?? 'en',
      });

      return reply.send(buildSuccessResponse(evaluation, { requestId: request.id }));
    },
  );
}
