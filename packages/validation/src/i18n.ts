import { z } from 'zod';
import { supportedLanguageSchema } from './common.js';

export const translateRequestSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, 'Text to translate cannot be empty')
    .max(5000, 'Text exceeds 5000 character limit'),
  sourceLanguage: supportedLanguageSchema.optional().default('en'),
  targetLanguage: supportedLanguageSchema,
  preserveNumbers: z.boolean().optional().default(true),
});

export const batchTranslateRequestSchema = z.object({
  texts: z
    .array(
      z
        .string()
        .trim()
        .min(1, 'Text item cannot be empty')
        .max(5000, 'Text item exceeds 5000 character limit'),
    )
    .min(1, 'At least one text item is required')
    .max(50, 'Batch translation is limited to 50 items'),
  sourceLanguage: supportedLanguageSchema.optional().default('en'),
  targetLanguage: supportedLanguageSchema,
  preserveNumbers: z.boolean().optional().default(true),
});

export const languageQuerySchema = z.object({
  language: supportedLanguageSchema.optional(),
});
