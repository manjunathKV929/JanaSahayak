import { z } from 'zod';
import { uuidSchema } from './common.js';

export const searchInterpretationBodySchema = z.object({
  query: z
    .string()
    .trim()
    .min(1, 'Query cannot be empty')
    .max(500, 'Query exceeds maximum length of 500 characters'),
  language: z.enum(['en', 'hi', 'kn']).optional().default('en'),
});

export type SearchInterpretationBody = z.infer<typeof searchInterpretationBodySchema>;

export const aiAssistBodySchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, 'Message cannot be empty')
    .max(1000, 'Message exceeds maximum length of 1000 characters'),
  language: z.enum(['en', 'hi', 'kn']).optional().default('en'),
  context: z
    .object({
      serviceId: uuidSchema.optional(),
      serviceSlug: z.string().trim().min(1).max(200).optional(),
    })
    .optional(),
});

export type AIAssistBody = z.infer<typeof aiAssistBodySchema>;
