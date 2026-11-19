import { z } from 'zod';
import {
  CONTENT_STATUSES,
  ROLES,
  SUPPORTED_LANGUAGES,
  VERIFICATION_STATUSES,
} from '@janasahayak/types';

export const uuidSchema = z.string().uuid();

export const requestIdSchema = z
  .string()
  .trim()
  .min(8)
  .max(128)
  .regex(/^[a-zA-Z0-9._-]+$/, 'Request ID contains invalid characters');

export const supportedLanguageSchema = z.enum(SUPPORTED_LANGUAGES);

export const roleSchema = z.enum(ROLES);

export const contentStatusSchema = z.enum(CONTENT_STATUSES);

export const verificationStatusSchema = z.enum(VERIFICATION_STATUSES);

export const paginationQuerySchema = z.object({
  cursor: z
    .string()
    .trim()
    .min(1)
    .max(256)
    .regex(/^[a-zA-Z0-9_-]+$/, 'Invalid opaque cursor')
    .optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const officialHttpsUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'https:';
      } catch {
        return false;
      }
    },
    { message: 'Official source URLs must use HTTPS' },
  );

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;
