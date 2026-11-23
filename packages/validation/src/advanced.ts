import { z } from 'zod';
import { sanitizeInputString } from './security.js';

export const deadlineStatusEnum = z.enum(['ALL', 'OPEN', 'CLOSING_SOON', 'EXPIRED', 'UPCOMING']);

export const deadlineQuerySchema = z.object({
  state: z.string().max(10).optional(),
  category: z.string().max(50).optional(),
  status: deadlineStatusEnum.default('ALL'),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type DeadlineQueryParams = z.infer<typeof deadlineQuerySchema>;

export const centerTypeEnum = z.enum([
  'B1_K1_CENTRE',
  'NADAKACHERI',
  'TALUK_OFFICE',
  'DISTRICT_OFFICE',
  'SEVA_KENDRA',
  'OTHER',
]);

export const locationQuerySchema = z.object({
  state: z.string().max(10).optional(),
  district: z.string().max(100).optional(),
  taluk: z.string().max(100).optional(),
  centerType: centerTypeEnum.optional(),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/, 'Invalid 6-digit Indian PIN code')
    .optional(),
  serviceId: z.string().uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  offset: z.coerce.number().int().min(0).default(0),
});

export type LocationQueryParams = z.infer<typeof locationQuerySchema>;

export const familyRelationshipEnum = z.enum([
  'SELF',
  'SPOUSE',
  'CHILD',
  'PARENT',
  'SIBLING',
  'GRANDPARENT',
  'OTHER',
]);

export const genderEnum = z.enum(['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_TO_SAY']);

const AADHAAR_REGEX = /\b[2-9]\d{3}\s?\d{4}\s?\d{4}\b/;
const PAN_REGEX = /\b[A-Z]{5}[0-9]{4}[A-Z]\b/i;

function preventPII(val: string): boolean {
  return !AADHAAR_REGEX.test(val) && !PAN_REGEX.test(val);
}

export const familyMemberSchema = z.object({
  id: z.string().optional(),
  name: z
    .string()
    .min(1, 'Name is required')
    .max(100, 'Name cannot exceed 100 characters')
    .transform((val) => sanitizeInputString(val))
    .refine(preventPII, 'Do not submit identity card or government numbers in family profile'),
  relationship: familyRelationshipEnum,
  age: z.coerce
    .number()
    .int()
    .min(0, 'Age must be 0 or greater')
    .max(120, 'Age must be 120 or less'),
  gender: genderEnum,
  occupation: z
    .string()
    .max(100)
    .transform((val) => sanitizeInputString(val))
    .refine(preventPII, 'Do not submit sensitive identification numbers')
    .default('Student / Dependent'),
  educationLevel: z
    .string()
    .max(100)
    .transform((val) => sanitizeInputString(val))
    .default('Not specified'),
  annualIncome: z.coerce
    .number()
    .min(0, 'Income must be non-negative')
    .max(100_000_000, 'Annual income exceeds reasonable threshold')
    .nullable()
    .optional(),
  casteCategory: z
    .string()
    .max(50)
    .transform((val) => sanitizeInputString(val))
    .nullable()
    .optional(),
  disability: z.boolean().default(false),
  residenceState: z.string().max(10).default('KA'),
});

export type FamilyMemberInput = z.infer<typeof familyMemberSchema>;

export const familyScanRequestSchema = z.object({
  members: z
    .array(familyMemberSchema)
    .min(1, 'At least one family member is required')
    .max(15, 'Maximum 15 family members allowed per scan'),
});

export type FamilyScanRequest = z.infer<typeof familyScanRequestSchema>;

export const lifeEventKeyEnum = z.enum([
  'EDUCATION_HIGHER',
  'CHILDBIRTH_MATERNITY',
  'EMPLOYMENT_LIVELIHOOD',
  'SENIOR_RETIREMENT',
  'BEREAVEMENT_SURVIVOR',
]);

export const lifeEventQuerySchema = z.object({
  key: lifeEventKeyEnum.optional(),
});

export type LifeEventQueryParams = z.infer<typeof lifeEventQuerySchema>;
