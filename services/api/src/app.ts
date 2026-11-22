import crypto from 'node:crypto';
import Fastify, { type FastifyError, type FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import swagger from '@fastify/swagger';
import { LOG_REDACTION_PATHS, type ApiEnv } from '@janasahayak/config';
import { checkDatabaseHealth, createDatabasePool, type Queryable } from '@janasahayak/db';
import { requestIdSchema } from '@janasahayak/validation';
import type { Pool } from 'pg';
import { AppError, buildErrorResponse, mapStatusCodeToErrorCode } from './errors.js';
import { registerAdminRoutes } from './routes/admin.js';
import { registerAIRoutes } from './routes/ai.js';
import { registerCatalogueRoutes } from './routes/catalogue.js';
import { registerDocumentsRoutes } from './routes/documents.js';
import { registerEligibilityRoutes } from './routes/eligibility.js';
import { registerHealthRoutes } from './routes/health.js';
import { registerI18nRoutes } from './routes/i18n.js';
import { registerJourneysRoutes } from './routes/journeys.js';

export const API_SERVICE_NAME = 'janasahayak-api';
export const API_VERSION = '0.1.0';
export const API_BASE_PATH = '/api/v1';

export interface BuildAppOptions {
  env: ApiEnv;
  checkDatabase?: () => Promise<'up' | 'down' | 'not_configured'>;
  db?: Queryable;
  ragService?: import('@janasahayak/ai').RAGService;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const { env } = options;

  const app = Fastify({
    trustProxy: env.API_TRUST_PROXY,
    // Disable Fastify's raw header pass-through so genReqId always validates X-Request-ID.
    requestIdHeader: false,
    genReqId: (req) => {
      const incoming = req.headers['x-request-id'];
      const candidate = Array.isArray(incoming) ? incoming[0] : incoming;
      if (candidate !== undefined) {
        const parsed = requestIdSchema.safeParse(candidate);
        if (parsed.success) {
          return parsed.data;
        }
      }
      return crypto.randomUUID();
    },
    logger:
      options.logger === false
        ? false
        : {
            level: env.API_LOG_LEVEL,
            redact: {
              paths: [...LOG_REDACTION_PATHS],
              censor: '[REDACTED]',
            },
          },
  });

  let dbPool: Pool | undefined;
  if (!options.checkDatabase && env.DATABASE_URL) {
    dbPool = createDatabasePool({
      connectionString: env.DATABASE_URL,
      ssl: env.DATABASE_SSL,
      maxConnections: env.DATABASE_POOL_MAX,
    });

    app.addHook('onClose', async () => {
      if (dbPool) {
        await dbPool.end();
      }
    });
  }

  const checkDatabase =
    options.checkDatabase ??
    (async (): Promise<'up' | 'down' | 'not_configured'> => {
      if (!dbPool) {
        return 'not_configured';
      }
      const healthy = await checkDatabaseHealth(dbPool);
      return healthy ? 'up' : 'down';
    });

  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'none'"],
        frameAncestors: ["'none'"],
        baseUri: ["'none'"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    hsts:
      env.NODE_ENV === 'production'
        ? { maxAge: 31536000, includeSubDomains: true, preload: true }
        : false,
  });

  await app.register(cors, {
    origin: env.API_CORS_ORIGINS,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization', 'X-Request-ID', 'Idempotency-Key'],
    exposedHeaders: ['X-Request-ID', 'Retry-After'],
    credentials: true,
  });

  await app.register(rateLimit, {
    max: env.API_RATE_LIMIT_MAX,
    timeWindow: env.API_RATE_LIMIT_WINDOW_MS,
    errorResponseBuilder: (_request, context) =>
      new AppError(429, 'RATE_LIMITED', `Rate limit exceeded. Retry after ${context.after}.`),
  });

  await app.register(swagger, {
    openapi: {
      openapi: '3.1.0',
      info: {
        title: 'JanaSahayak API',
        description:
          'Public-service guidance API for JanaSahayak. Guidance layer only — not an official government authority.',
        version: API_VERSION,
      },
      servers: [
        {
          url: API_BASE_PATH,
          description: 'Version 1 API',
        },
      ],
      tags: [
        { name: 'System', description: 'Health and operational endpoints' },
        {
          name: 'Admin Content',
          description: 'Administrative content management and workflow endpoints',
        },
        {
          name: 'Public Catalogue',
          description: 'Public service discovery and details endpoints',
        },
        {
          name: 'Eligibility',
          description: 'Deterministic eligibility evaluation and questionnaire endpoints',
        },
        {
          name: 'Documents',
          description: 'Authoritative document guide and issuing authority endpoints',
        },
        {
          name: 'AI Assistant',
          description:
            'Grounded civic assistance, query interpretation, and provenance verification endpoints',
        },
      ],
    },
  });

  app.addHook('onSend', async (request, reply, payload) => {
    reply.header('X-Request-ID', request.id);
    reply.header('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
    return payload;
  });

  app.setNotFoundHandler(async (request, reply) => {
    return reply
      .code(404)
      .send(buildErrorResponse('NOT_FOUND', 'The requested resource was not found.', request.id));
  });

  app.setErrorHandler(async (error: FastifyError | AppError, request, reply) => {
    if (error instanceof AppError) {
      return reply
        .code(error.statusCode)
        .send(buildErrorResponse(error.code, error.message, request.id, error.details));
    }

    if ('validation' in error && Array.isArray(error.validation)) {
      const details = error.validation.map((issue) => {
        const field = issue.instancePath.replace(/^\//, '');
        const message = issue.message ?? 'Invalid input value';
        return field.length > 0 ? { field, message } : { message };
      });
      return reply
        .code(400)
        .send(
          buildErrorResponse('VALIDATION_ERROR', 'The request is invalid.', request.id, details),
        );
    }

    const statusCode =
      typeof error.statusCode === 'number' && error.statusCode >= 400 && error.statusCode < 600
        ? error.statusCode
        : 500;

    if (statusCode >= 500) {
      request.log.error({ err: error, requestId: request.id }, 'Unhandled server error');
      return reply
        .code(statusCode)
        .send(
          buildErrorResponse(
            mapStatusCodeToErrorCode(statusCode),
            'An unexpected error occurred.',
            request.id,
          ),
        );
    }

    const code = mapStatusCodeToErrorCode(statusCode);
    const safeMessage =
      statusCode === 400
        ? 'The request is malformed or invalid.'
        : error.message || 'Request failed.';

    return reply.code(statusCode).send(buildErrorResponse(code, safeMessage, request.id));
  });

  const db = options.db ?? dbPool;

  await app.register(
    async (v1) => {
      await registerHealthRoutes(v1, {
        serviceName: API_SERVICE_NAME,
        version: API_VERSION,
        checkDatabase,
      });

      const activeDb: Queryable =
        db ??
        ({
          query: async () => {
            throw new AppError(503, 'SERVICE_UNAVAILABLE', 'Database is not configured.');
          },
        } as Queryable);

      await registerAdminRoutes(v1, {
        db: activeDb,
        isProduction: env.NODE_ENV === 'production',
      });

      await registerCatalogueRoutes(v1, {
        db: activeDb,
      });

      await registerEligibilityRoutes(v1, {
        db: activeDb,
      });

      await registerDocumentsRoutes(v1, {
        db: activeDb,
      });

      await registerJourneysRoutes(v1, {
        db: activeDb,
      });

      await registerI18nRoutes(v1);

      await registerAIRoutes(v1, {
        db: activeDb,
        ...(options.ragService ? { ragService: options.ragService } : {}),
      });

      v1.get(
        '/openapi.json',
        {
          schema: {
            hide: true,
          },
        },
        async (_request, reply) => {
          reply.header('Cache-Control', 'no-store');
          return app.swagger();
        },
      );
    },
    { prefix: API_BASE_PATH },
  );

  return app;
}
