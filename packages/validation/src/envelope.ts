import { z } from 'zod';

export const apiMetaSchema = z.object({
  requestId: z.string().min(1),
});

export const apiErrorDetailSchema = z.object({
  field: z.string().optional(),
  message: z.string(),
  code: z.string().optional(),
});

export const apiErrorCodeSchema = z.enum([
  'BAD_REQUEST',
  'VALIDATION_ERROR',
  'UNAUTHORIZED',
  'FORBIDDEN',
  'NOT_FOUND',
  'CONFLICT',
  'UNPROCESSABLE_ENTITY',
  'RATE_LIMITED',
  'INTERNAL_ERROR',
  'SERVICE_UNAVAILABLE',
]);

export const apiErrorResponseSchema = z.object({
  error: z.object({
    code: apiErrorCodeSchema,
    message: z.string(),
    details: z.array(apiErrorDetailSchema),
  }),
  meta: apiMetaSchema,
});

export const healthCheckPayloadSchema = z.object({
  status: z.literal('ok'),
  service: z.string(),
  version: z.string(),
  timestamp: z.string().datetime(),
});

export const readinessCheckPayloadSchema = z.object({
  status: z.enum(['ready', 'not_ready']),
  service: z.string(),
  version: z.string(),
  timestamp: z.string().datetime(),
  checks: z.object({
    database: z.enum(['up', 'down', 'not_configured']),
  }),
});

export function createSuccessEnvelopeSchema<T extends z.ZodTypeAny>(dataSchema: T) {
  return z.object({
    data: dataSchema,
    meta: apiMetaSchema,
  });
}
