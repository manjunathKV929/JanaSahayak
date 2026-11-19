import { z } from 'zod';
import {
  officialHttpsUrlSchema,
  paginationQuerySchema,
  supportedLanguageSchema,
  uuidSchema,
  verificationStatusSchema,
} from './common.js';

export const serviceSlugSchema = z
  .string()
  .trim()
  .min(3)
  .max(100)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lower-case alphanumeric with hyphens');

export const stateCodeSchema = z
  .string()
  .trim()
  .length(2)
  .regex(/^[A-Z]{2}$/, 'State code must be 2 uppercase letters (e.g. KA, MH, DL)');

export const createServiceSchema = z.object({
  slug: serviceSlugSchema,
  serviceType: z.string().trim().min(2).max(50),
  title: z.string().trim().min(3).max(255),
  shortDescription: z.string().trim().min(10).max(1000),
  departmentName: z.string().trim().min(2).max(255),
  stateCode: stateCodeSchema.nullable().optional(),
});

export const updateServiceSchema = z
  .object({
    slug: serviceSlugSchema.optional(),
    serviceType: z.string().trim().min(2).max(50).optional(),
    title: z.string().trim().min(3).max(255).optional(),
    shortDescription: z.string().trim().min(10).max(1000).optional(),
    departmentName: z.string().trim().min(2).max(255).optional(),
    stateCode: stateCodeSchema.nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const createServiceVersionSchema = z.object({
  content: z
    .record(z.string(), z.unknown())
    .refine((obj) => Object.keys(obj).length > 0, { message: 'Version content cannot be empty' }),
  language: supportedLanguageSchema.default('en'),
  effectiveFrom: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
  effectiveTo: z
    .string()
    .trim()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .nullable()
    .optional(),
});

export const createServiceSourceSchema = z.object({
  sourceUrl: officialHttpsUrlSchema,
  sourceType: z.string().trim().min(2).max(50),
  publisher: z.string().trim().min(2).max(255),
  verificationStatus: verificationStatusSchema.default('UNVERIFIED'),
  reviewNotes: z.string().trim().max(1000).nullable().optional(),
});

export const reviewDecisionSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'CHANGES_REQUESTED']),
  notes: z.string().trim().max(2000).nullable().optional(),
});

export const submitReviewSchema = z.object({
  notes: z.string().trim().max(1000).nullable().optional(),
});

export const publishServiceSchema = z.object({
  versionId: uuidSchema.optional(),
});

export const auditLogQuerySchema = paginationQuerySchema.extend({
  actorId: uuidSchema.optional(),
  resourceType: z.string().trim().min(1).max(50).optional(),
  resourceId: uuidSchema.optional(),
  offset: z.coerce.number().int().min(0).default(0),
});

export type CreateServiceInput = z.infer<typeof createServiceSchema>;
export type UpdateServiceInput = z.infer<typeof updateServiceSchema>;
export type CreateServiceVersionInput = z.infer<typeof createServiceVersionSchema>;
export type CreateServiceSourceInput = z.infer<typeof createServiceSourceSchema>;
export type ReviewDecisionInput = z.infer<typeof reviewDecisionSchema>;
export type SubmitReviewInput = z.infer<typeof submitReviewSchema>;
export type PublishServiceInput = z.infer<typeof publishServiceSchema>;
export type AuditLogQuery = z.infer<typeof auditLogQuerySchema>;
