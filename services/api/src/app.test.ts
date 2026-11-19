import assert from 'node:assert/strict';
import { afterEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { loadApiEnv } from '@janasahayak/config';
import {
  apiErrorResponseSchema,
  createSuccessEnvelopeSchema,
  healthCheckPayloadSchema,
  readinessCheckPayloadSchema,
} from '@janasahayak/validation';
import { buildApp } from './app.js';

describe('@janasahayak/api', () => {
  const openApps: FastifyInstance[] = [];

  async function createTestApp(
    checkDatabase: () => Promise<'up' | 'down' | 'not_configured'> = async () => 'up',
    overrides: Record<string, string | undefined> = {},
  ): Promise<FastifyInstance> {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
      API_RATE_LIMIT_MAX: '50',
      API_RATE_LIMIT_WINDOW_MS: '60000',
      ...overrides,
    });
    const app = await buildApp({ env, logger: false, checkDatabase });
    openApps.push(app);
    return app;
  }

  afterEach(async () => {
    while (openApps.length > 0) {
      const app = openApps.pop();
      if (app) {
        await app.close();
      }
    }
  });

  it('returns standard envelope and security headers on GET /api/v1/health', async () => {
    const app = await createTestApp();
    const requestId = '550e8400-e29b-41d4-a716-446655440000';

    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: {
        'x-request-id': requestId,
      },
    });

    assert.equal(response.statusCode, 200);
    assert.equal(response.headers['x-request-id'], requestId);
    assert.equal(response.headers['x-content-type-options'], 'nosniff');
    assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
    assert.match(String(response.headers['permissions-policy']), /camera=\(\)/);
    assert.match(String(response.headers['content-security-policy']), /default-src 'none'/);

    const parsed = createSuccessEnvelopeSchema(healthCheckPayloadSchema).parse(response.json());
    assert.equal(parsed.data.status, 'ok');
    assert.equal(parsed.meta.requestId, requestId);
  });

  it('replaces invalid X-Request-ID values with a generated UUID', async () => {
    const app = await createTestApp();
    const response = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
      headers: {
        'x-request-id': 'bad\r\nid',
      },
    });

    assert.equal(response.statusCode, 200);
    const returnedId = response.headers['x-request-id'];
    assert.equal(typeof returnedId, 'string');
    assert.match(
      String(returnedId),
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('returns 200 on GET /api/v1/ready when database is up and 503 when database is down', async () => {
    const healthyApp = await createTestApp(async () => 'up');
    const okRes = await healthyApp.inject({ method: 'GET', url: '/api/v1/ready' });
    assert.equal(okRes.statusCode, 200);
    const okBody = createSuccessEnvelopeSchema(readinessCheckPayloadSchema).parse(okRes.json());
    assert.equal(okBody.data.checks.database, 'up');

    const degradedApp = await createTestApp(async () => 'down');
    const failRes = await degradedApp.inject({ method: 'GET', url: '/api/v1/ready' });
    assert.equal(failRes.statusCode, 503);
    const errBody = apiErrorResponseSchema.parse(failRes.json());
    assert.equal(errBody.error.code, 'SERVICE_UNAVAILABLE');
  });

  it('serves a valid OpenAPI 3.1 specification at GET /api/v1/openapi.json', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/openapi.json' });

    assert.equal(response.statusCode, 200);
    const spec = response.json() as {
      openapi: string;
      info: { title: string };
      servers: Array<{ url: string }>;
      paths: Record<string, unknown>;
    };
    assert.equal(spec.openapi, '3.1.0');
    assert.equal(spec.info.title, 'JanaSahayak API');
    assert.equal(spec.servers[0]?.url, '/api/v1');
    assert.ok(spec.paths['/health']);
    assert.ok(spec.paths['/ready']);
  });

  it('returns consistent error envelope without stack traces on 404', async () => {
    const app = await createTestApp();
    const response = await app.inject({ method: 'GET', url: '/api/v1/does-not-exist' });

    assert.equal(response.statusCode, 404);
    const body = apiErrorResponseSchema.parse(response.json());
    assert.equal(body.error.code, 'NOT_FOUND');
    assert.equal(JSON.stringify(body).includes('stack'), false);
  });

  it('enforces rate limits with 429 and consistent error envelope', async () => {
    const app = await createTestApp(async () => 'up', {
      API_RATE_LIMIT_MAX: '2',
      API_RATE_LIMIT_WINDOW_MS: '60000',
    });

    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/health' })).statusCode, 200);
    assert.equal((await app.inject({ method: 'GET', url: '/api/v1/health' })).statusCode, 200);

    const limited = await app.inject({ method: 'GET', url: '/api/v1/health' });
    assert.equal(limited.statusCode, 429);
    const body = apiErrorResponseSchema.parse(limited.json());
    assert.equal(body.error.code, 'RATE_LIMITED');
  });
});
