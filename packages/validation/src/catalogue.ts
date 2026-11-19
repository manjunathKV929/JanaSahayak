import { z } from 'zod';
import { serviceSlugSchema, stateCodeSchema } from './admin.js';
import { paginationQuerySchema, supportedLanguageSchema } from './common.js';

export const searchServicesQuerySchema = paginationQuerySchema.extend({
  q: z.string().trim().min(1).max(100).optional(),
  category: z.string().trim().min(1).max(50).optional(),
  state: stateCodeSchema.optional(),
  language: supportedLanguageSchema.default('en'),
  offset: z.coerce.number().int().min(0).default(0),
});

export const serviceSlugParamSchema = z.object({
  slug: serviceSlugSchema,
});

export type SearchServicesQuery = z.infer<typeof searchServicesQuerySchema>;
export type ServiceSlugParam = z.infer<typeof serviceSlugParamSchema>;
