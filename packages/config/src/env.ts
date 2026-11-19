import { z } from 'zod';
import { RUNTIME_ENVIRONMENTS, SUPPORTED_LANGUAGES } from '@janasahayak/types';

const booleanFromEnvSchema = z.preprocess((value) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase();
    if (normalized === 'true' || normalized === '1') return true;
    if (normalized === 'false' || normalized === '0' || normalized === '') return false;
  }
  return value;
}, z.boolean());

const corsOriginsSchema = z
  .string()
  .trim()
  .min(1, 'API_CORS_ORIGINS must specify at least one allowed origin')
  .transform((raw) =>
    raw
      .split(',')
      .map((origin) => origin.trim())
      .filter((origin) => origin.length > 0),
  )
  .refine((origins) => origins.length > 0, {
    message: 'API_CORS_ORIGINS must contain at least one valid origin',
  })
  .refine(
    (origins) =>
      origins.every((origin) => {
        if (origin === '*') return false;
        try {
          const parsed = new URL(origin);
          return parsed.protocol === 'http:' || parsed.protocol === 'https:';
        } catch {
          return false;
        }
      }),
    {
      message: 'API_CORS_ORIGINS must contain explicit http(s) origins and never "*"',
    },
  );

const postgresUrlSchema = z
  .string()
  .trim()
  .refine(
    (value) => {
      try {
        const parsed = new URL(value);
        return parsed.protocol === 'postgresql:' || parsed.protocol === 'postgres:';
      } catch {
        return false;
      }
    },
    { message: 'DATABASE_URL must be a valid postgresql:// or postgres:// connection URL' },
  );

export const dbEnvSchema = z
  .object({
    NODE_ENV: z.enum(RUNTIME_ENVIRONMENTS).default('development'),
    DATABASE_URL: postgresUrlSchema,
    DATABASE_SSL: booleanFromEnvSchema.default(false),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (!env.DATABASE_SSL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_SSL'],
          message: 'DATABASE_SSL must be true in production',
        });
      }
      if (env.DATABASE_URL.includes('change_me_local_dev_only')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'Default development database credentials are forbidden in production',
        });
      }
    }
  });

export const apiEnvSchema = z
  .object({
    NODE_ENV: z.enum(RUNTIME_ENVIRONMENTS).default('development'),
    API_HOST: z.string().trim().min(1).default('127.0.0.1'),
    API_PORT: z.coerce.number().int().min(1).max(65535).default(4000),
    API_LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
    API_CORS_ORIGINS: corsOriginsSchema.default('http://localhost:3000'),
    API_RATE_LIMIT_MAX: z.coerce.number().int().min(1).max(10000).default(100),
    API_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().min(1000).max(3600000).default(60000),
    API_TRUST_PROXY: booleanFromEnvSchema.default(false),
    DATABASE_URL: postgresUrlSchema.optional(),
    DATABASE_SSL: booleanFromEnvSchema.default(false),
    DATABASE_POOL_MAX: z.coerce.number().int().min(1).max(100).default(10),
    AI_PROVIDER: z.enum(['mock']).default('mock'),
  })
  .superRefine((env, ctx) => {
    if (env.NODE_ENV === 'production') {
      if (!env.DATABASE_URL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_URL'],
          message: 'DATABASE_URL is required in production',
        });
      }
      if (!env.DATABASE_SSL) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['DATABASE_SSL'],
          message: 'DATABASE_SSL must be true in production',
        });
      }
      if (env.API_CORS_ORIGINS.some((origin) => origin.startsWith('http://'))) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['API_CORS_ORIGINS'],
          message: 'API_CORS_ORIGINS must use HTTPS in production',
        });
      }
    }
  });

export const webEnvSchema = z.object({
  NODE_ENV: z.enum(RUNTIME_ENVIRONMENTS).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().trim().min(1).default('JanaSahayak'),
  NEXT_PUBLIC_API_BASE_URL: z
    .string()
    .trim()
    .url()
    .refine(
      (value) => {
        const parsed = new URL(value);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      },
      { message: 'NEXT_PUBLIC_API_BASE_URL must be an http(s) URL' },
    )
    .default('http://127.0.0.1:4000/api/v1'),
  NEXT_PUBLIC_DEFAULT_LANGUAGE: z.enum(SUPPORTED_LANGUAGES).default('en'),
});

export type DbEnv = z.infer<typeof dbEnvSchema>;
export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;

export class EnvValidationError extends Error {
  public readonly issues: ReadonlyArray<{ path: string; message: string }>;

  constructor(scope: string, issues: ReadonlyArray<{ path: string; message: string }>) {
    const summary = issues.map((issue) => `${issue.path || 'root'}: ${issue.message}`).join('; ');
    super(`Invalid ${scope} environment configuration: ${summary}`);
    this.name = 'EnvValidationError';
    this.issues = issues;
  }
}

function parseWithSchema<T extends z.ZodTypeAny>(
  scope: string,
  schema: T,
  rawEnv: Record<string, string | undefined>,
): z.infer<T> {
  const result = schema.safeParse(rawEnv);
  if (!result.success) {
    // Deliberately omit raw values so secrets are never leaked into error logs.
    const issues = result.error.issues.map((issue) => ({
      path: issue.path.join('.'),
      message: issue.message,
    }));
    throw new EnvValidationError(scope, issues);
  }
  return result.data;
}

export function loadApiEnv(rawEnv: Record<string, string | undefined> = process.env): ApiEnv {
  return parseWithSchema('API', apiEnvSchema, rawEnv);
}

export function loadDbEnv(rawEnv: Record<string, string | undefined> = process.env): DbEnv {
  return parseWithSchema('Database', dbEnvSchema, rawEnv);
}

export function loadWebEnv(rawEnv: Record<string, string | undefined> = process.env): WebEnv {
  return parseWithSchema('Web', webEnvSchema, rawEnv);
}
