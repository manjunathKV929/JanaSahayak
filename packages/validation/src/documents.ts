import { z } from 'zod';
import { safeRelativePathSchema } from './security.js';

export const documentIdParamSchema = z.object({
  id: z
    .string()
    .min(1, 'Document identifier is required')
    .max(100, 'Document identifier is too long')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Document identifier must be alphanumeric, hyphen or underscore'),
});

export type DocumentIdParam = z.infer<typeof documentIdParamSchema>;

export const documentGuideQuerySchema = z.object({
  returnTo: safeRelativePathSchema.optional(),
  language: z.enum(['en', 'hi', 'kn'] as const).optional(),
});

export type DocumentGuideQuery = z.infer<typeof documentGuideQuerySchema>;
