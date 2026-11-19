import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { EnvValidationError, loadApiEnv, loadDbEnv, loadWebEnv } from './env.js';
import { redactSensitiveObject, redactSensitiveText } from './redaction.js';

describe('@janasahayak/config', () => {
  it('loads valid development defaults for API env', () => {
    const env = loadApiEnv({ NODE_ENV: 'development' });
    assert.equal(env.API_HOST, '127.0.0.1');
    assert.equal(env.API_PORT, 4000);
    assert.deepEqual(env.API_CORS_ORIGINS, ['http://localhost:3000']);
    assert.equal(env.AI_PROVIDER, 'mock');
  });

  it('rejects wildcard CORS origins', () => {
    assert.throws(
      () =>
        loadApiEnv({
          NODE_ENV: 'development',
          API_CORS_ORIGINS: '*',
        }),
      EnvValidationError,
    );
  });

  it('enforces TLS and HTTPS origins in production', () => {
    assert.throws(
      () =>
        loadApiEnv({
          NODE_ENV: 'production',
          DATABASE_URL: 'postgresql://user:strongpass@db.example.com:5432/prod',
          DATABASE_SSL: 'false',
          API_CORS_ORIGINS: 'http://janasahayak.example.org',
        }),
      EnvValidationError,
    );

    const prod = loadApiEnv({
      NODE_ENV: 'production',
      DATABASE_URL: 'postgresql://user:strongpass@db.example.com:5432/prod',
      DATABASE_SSL: 'true',
      API_CORS_ORIGINS: 'https://janasahayak.example.org',
    });
    assert.equal(prod.DATABASE_SSL, true);
    assert.deepEqual(prod.API_CORS_ORIGINS, ['https://janasahayak.example.org']);
  });

  it('never leaks raw secret values in validation error messages', () => {
    const fakeSecret = 'super-secret-password-999';
    assert.throws(
      () =>
        loadDbEnv({
          NODE_ENV: 'production',
          DATABASE_URL: `not-a-pg-url://${fakeSecret}`,
          DATABASE_SSL: 'false',
        }),
      (error: unknown) => {
        assert.ok(error instanceof EnvValidationError);
        assert.equal(error.message.includes(fakeSecret), false);
        return true;
      },
    );
  });

  it('validates web environment configuration', () => {
    const web = loadWebEnv({
      NODE_ENV: 'development',
      NEXT_PUBLIC_API_BASE_URL: 'http://127.0.0.1:4000/api/v1',
      NEXT_PUBLIC_DEFAULT_LANGUAGE: 'kn',
    });
    assert.equal(web.NEXT_PUBLIC_DEFAULT_LANGUAGE, 'kn');
  });

  it('redacts sensitive keys and Aadhaar-like identifiers', () => {
    assert.equal(
      redactSensitiveText('My number is 1234 5678 9012 please check'),
      'My number is [REDACTED_ID] please check',
    );

    assert.deepEqual(
      redactSensitiveObject({
        email: 'citizen@example.org',
        password: 'plain-password',
        otp: '123456',
        nested: { authorization: 'Bearer abc', note: 'id 1234-5678-9012' },
      }),
      {
        email: 'citizen@example.org',
        password: '[REDACTED]',
        otp: '[REDACTED]',
        nested: { authorization: '[REDACTED]', note: 'id [REDACTED_ID]' },
      },
    );
  });
});
