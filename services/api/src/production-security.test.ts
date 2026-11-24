import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadApiEnv } from '@janasahayak/config';
import { buildApp } from './app.js';

describe('Phase 14 Production Security & Hardening Suite', () => {
  it('enforces strict defensive headers on all production responses', async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'https://janasahayak.gov.in',
    });

    const app = await buildApp({
      env,
      logger: false,
      checkDatabase: async () => 'up',
    });

    await app.ready();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/health',
    });

    assert.equal(res.statusCode, 200);
    assert.equal(res.headers['x-content-type-options'], 'nosniff');
    assert.equal(res.headers['x-frame-options'], 'DENY');
    assert.ok(String(res.headers['permissions-policy']).includes('camera=()'));
    assert.ok(String(res.headers['permissions-policy']).includes('microphone=()'));
    assert.ok(String(res.headers['permissions-policy']).includes('geolocation=()'));
    assert.ok(res.headers['x-request-id'] !== undefined, 'Must provide correlation X-Request-ID');
    assert.ok(
      String(res.headers['cache-control']).includes('no-store'),
      'Operational health route must prohibit caching',
    );

    await app.close();
  });

  it('rate limiter triggers HTTP 429 when burst threshold is exceeded', async () => {
    const burstLimit = 5;
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
      API_RATE_LIMIT_MAX: burstLimit,
      API_RATE_LIMIT_WINDOW_MS: 60000,
    });

    const app = await buildApp({
      env,
      logger: false,
      checkDatabase: async () => 'up',
    });

    await app.ready();

    let rateLimited = false;
    let rateLimitResponse: {
      statusCode: number;
      headers: Record<string, unknown>;
      body: string;
    } | null = null;

    // Send burst of requests exceeding the limit
    for (let i = 0; i < burstLimit + 4; i++) {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      if (res.statusCode === 429) {
        rateLimited = true;
        rateLimitResponse = res;
        break;
      }
    }

    assert.ok(
      rateLimited,
      'Expected rate limiter to trip with HTTP 429 after exceeding max requests',
    );
    assert.ok(rateLimitResponse !== null);
    assert.equal(rateLimitResponse.statusCode, 429);
    assert.ok(
      rateLimitResponse.headers['retry-after'] !== undefined ||
        rateLimitResponse.headers['x-ratelimit-reset'] !== undefined,
      'Must provide retry guidance in headers',
    );

    const body = JSON.parse(rateLimitResponse.body);
    assert.ok(
      body.error.code === 'RATE_LIMITED' || body.error.code === 'RATE_LIMIT_EXCEEDED',
      `Expected rate limit code, got ${body.error.code}`,
    );
    assert.ok(body.meta.requestId, 'Error response must contain requestId');

    await app.close();
  });

  it('never leaks database passwords, system secrets, or stack traces in errors', async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });

    const secretPassword = 'SUPER_SECRET_DATABASE_PASSWORD_XYZ';

    // Mock DB that throws an internal error containing sensitive credentials
    const app = await buildApp({
      env,
      logger: false,
      checkDatabase: async () => {
        throw new Error(
          `FATAL: connection failed postgresql://admin:${secretPassword}@10.0.0.5:5432/db`,
        );
      },
      db: {
        query: async () => {
          throw new Error(`Connection timeout on host 10.0.0.5 with password ${secretPassword}`);
        },
      },
    });

    await app.ready();

    // 1. Check readiness probe with failing DB
    const readyRes = await app.inject({
      method: 'GET',
      url: '/api/v1/ready',
    });

    assert.equal(readyRes.statusCode, 503);
    assert.ok(
      !readyRes.body.includes(secretPassword),
      'Readiness probe must NEVER leak DB password',
    );
    assert.ok(!readyRes.body.includes('10.0.0.5'), 'Readiness probe must NEVER leak internal IP');

    // 2. Check 404 handler
    const notFoundRes = await app.inject({
      method: 'GET',
      url: '/api/v1/non-existent-secret-probe',
    });

    assert.equal(notFoundRes.statusCode, 404);
    const notFoundBody = JSON.parse(notFoundRes.body);
    assert.equal(notFoundBody.error.code, 'NOT_FOUND');
    assert.ok(notFoundBody.meta.requestId);

    // 3. Check internal 500 error sanitization
    const errRes = await app.inject({
      method: 'GET',
      url: '/api/v1/services/test-trigger-db-err',
    });

    assert.ok(errRes.statusCode >= 400);
    assert.ok(
      !errRes.body.includes(secretPassword),
      'Error response must NEVER disclose DB password',
    );
    assert.ok(
      !errRes.body.includes('node_modules'),
      'Error response must NOT disclose server path',
    );

    await app.close();
  });

  it('protects against Prototype Pollution and Parameter Tampering', async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });

    const app = await buildApp({
      env,
      logger: false,
      checkDatabase: async () => 'up',
    });

    await app.ready();

    // Malicious payload with prototype pollution vector
    const pollutedPayload = JSON.stringify({
      __proto__: { isAdmin: true },
      constructor: { prototype: { role: 'ADMIN' } },
      members: [],
    });

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/family/scan',
      headers: {
        'content-type': 'application/json',
      },
      payload: pollutedPayload,
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(
      body.error.code === 'VALIDATION_ERROR' || body.error.code === 'BAD_REQUEST',
      `Expected validation error or bad request, got ${body.error.code}`,
    );

    // Ensure server object prototype was NOT polluted
    const cleanObj: Record<string, unknown> = {};
    assert.equal((cleanObj as Record<string, unknown>).isAdmin, undefined);
    assert.equal((cleanObj as Record<string, unknown>).role, undefined);

    await app.close();
  });

  it('rejects PII in family scanner and returns strict 400 without storing identifiers', async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });

    const app = await buildApp({
      env,
      logger: false,
      checkDatabase: async () => 'up',
    });

    await app.ready();

    // Adversarial request with 12-digit Aadhaar-like number in name
    const piiPayload = {
      district: 'Bangalore Urban',
      annualFamilyIncome: 120000,
      members: [
        {
          id: 'm-1',
          name: 'Sunita 9876 5432 1098', // Illegal Aadhaar number in name
          relationship: 'SELF',
          age: 42,
          gender: 'FEMALE',
        },
      ],
    };

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/family/scan',
      headers: { 'content-type': 'application/json' },
      payload: piiPayload,
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.body);
    assert.ok(
      body.error.code === 'VALIDATION_ERROR' || body.error.code === 'BAD_REQUEST',
      `Expected validation error or bad request, got ${body.error.code}`,
    );
    assert.ok(
      body.error.details.some(
        (d: { message: string }) =>
          d.message.toLowerCase().includes('identity card') ||
          d.message.toLowerCase().includes('government numbers') ||
          d.message.toLowerCase().includes('sensitive'),
      ),
    );

    await app.close();
  });
});
