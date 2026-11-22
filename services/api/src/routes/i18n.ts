import type { FastifyInstance } from 'fastify';
import { BhashiniService, SUPPORTED_LANGUAGES_LIST, getLanguageMeta } from '@janasahayak/i18n';
import type { ApiErrorDetail } from '@janasahayak/types';
import { batchTranslateRequestSchema, translateRequestSchema } from '@janasahayak/validation';
import type { z } from 'zod';
import { AppError, buildSuccessResponse } from '../errors.js';

export interface I18nRouteOptions {
  bhashiniService?: BhashiniService | undefined;
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

const languageMetaJsonSchema = {
  type: 'object',
  required: ['code', 'name', 'nativeName', 'script', 'fontFamily', 'direction'],
  properties: {
    code: { type: 'string', enum: ['en', 'hi', 'kn'] },
    name: { type: 'string' },
    nativeName: { type: 'string' },
    script: { type: 'string' },
    fontFamily: { type: 'string' },
    direction: { type: 'string', enum: ['ltr'] },
  },
} as const;

const translationResponseJsonSchema = {
  type: 'object',
  required: ['translatedText', 'sourceLanguage', 'targetLanguage', 'provider'],
  properties: {
    translatedText: { type: 'string' },
    sourceLanguage: { type: 'string', enum: ['en', 'hi', 'kn'] },
    targetLanguage: { type: 'string', enum: ['en', 'hi', 'kn'] },
    provider: { type: 'string', enum: ['bhashini', 'mock', 'fallback'] },
    cached: { type: 'boolean' },
    preservedNumbers: { type: 'boolean' },
  },
} as const;

export async function registerI18nRoutes(
  app: FastifyInstance,
  options: I18nRouteOptions = {},
): Promise<void> {
  const bhashini = options.bhashiniService ?? new BhashiniService();

  // 1. GET /languages - List supported languages and metadata
  app.get(
    '/languages',
    {
      schema: {
        tags: ['Multilingual & Translation'],
        summary: 'Get supported Indian languages metadata',
        description:
          'Returns supported languages list with native names, typography and direction metadata.',
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: languageMetaJsonSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const languages = SUPPORTED_LANGUAGES_LIST.map((code) => getLanguageMeta(code));
      return reply.send(buildSuccessResponse(languages, { requestId: request.id }));
    },
  );

  // 2. POST /translate - Translate text with Bhashini AI & numeric preservation
  app.post(
    '/translate',
    {
      schema: {
        tags: ['Multilingual & Translation'],
        summary: 'Translate text via Bhashini AI with numeric preservation',
        description:
          'Translates citizen query or civic explanation text. Strictly enforces numeric preservation so numeric rules and thresholds are never altered.',
        body: {
          type: 'object',
          required: ['text', 'targetLanguage'],
          properties: {
            text: { type: 'string', minLength: 1, maxLength: 5000 },
            sourceLanguage: { type: 'string', enum: ['en', 'hi', 'kn'], default: 'en' },
            targetLanguage: { type: 'string', enum: ['en', 'hi', 'kn'] },
            preserveNumbers: { type: 'boolean', default: true },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: translationResponseJsonSchema,
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = translateRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid translation request payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      try {
        const result = await bhashini.translate({
          text: parsed.data.text,
          sourceLanguage: parsed.data.sourceLanguage,
          targetLanguage: parsed.data.targetLanguage,
          preserveNumbers: parsed.data.preserveNumbers,
        });

        return reply.send(buildSuccessResponse(result, { requestId: request.id }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Translation error';
        throw new AppError(422, 'UNPROCESSABLE_ENTITY', message);
      }
    },
  );

  // 3. POST /translate/batch - Batch translation
  app.post(
    '/translate/batch',
    {
      schema: {
        tags: ['Multilingual & Translation'],
        summary: 'Batch translate text items via Bhashini AI',
        description:
          'Translates up to 50 text items concurrently with strict numeric preservation.',
        body: {
          type: 'object',
          required: ['texts', 'targetLanguage'],
          properties: {
            texts: {
              type: 'array',
              items: { type: 'string', minLength: 1, maxLength: 5000 },
              minItems: 1,
              maxItems: 50,
            },
            sourceLanguage: { type: 'string', enum: ['en', 'hi', 'kn'], default: 'en' },
            targetLanguage: { type: 'string', enum: ['en', 'hi', 'kn'] },
            preserveNumbers: { type: 'boolean', default: true },
          },
        },
        response: {
          200: {
            type: 'object',
            required: ['data', 'meta'],
            properties: {
              data: {
                type: 'array',
                items: translationResponseJsonSchema,
              },
              meta: metaJsonSchema,
            },
          },
        },
      },
    },
    async (request, reply) => {
      const parsed = batchTranslateRequestSchema.safeParse(request.body);
      if (!parsed.success) {
        throw new AppError(
          400,
          'VALIDATION_ERROR',
          'Invalid batch translation payload.',
          formatZodIssues(parsed.error.issues),
        );
      }

      try {
        const requests = parsed.data.texts.map((text) => ({
          text,
          sourceLanguage: parsed.data.sourceLanguage,
          targetLanguage: parsed.data.targetLanguage,
          preserveNumbers: parsed.data.preserveNumbers,
        }));

        const results = await bhashini.translateBatch(requests);
        return reply.send(buildSuccessResponse(results, { requestId: request.id }));
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Batch translation error';
        throw new AppError(422, 'UNPROCESSABLE_ENTITY', message);
      }
    },
  );
}
