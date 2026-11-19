export const ROLES = [
  'PUBLIC_USER',
  'CONTENT_EDITOR',
  'CONTENT_REVIEWER',
  'ADMIN',
  'SECURITY_ADMIN',
] as const;

export type Role = (typeof ROLES)[number];

export const CONTENT_STATUSES = [
  'DRAFT',
  'IN_REVIEW',
  'VERIFIED',
  'PUBLISHED',
  'REVIEW_DUE',
  'DEPRECATED',
  'REJECTED',
] as const;

export type ContentStatus = (typeof CONTENT_STATUSES)[number];

export const VERIFICATION_STATUSES = [
  'VERIFIED',
  'REVIEW_DUE',
  'DEPRECATED',
  'DISPUTED',
  'UNVERIFIED',
] as const;

export type VerificationStatus = (typeof VERIFICATION_STATUSES)[number];

export const SUPPORTED_LANGUAGES = ['en', 'hi', 'kn'] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

export const RUNTIME_ENVIRONMENTS = ['development', 'test', 'staging', 'production'] as const;

export type RuntimeEnvironment = (typeof RUNTIME_ENVIRONMENTS)[number];
