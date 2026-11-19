import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  officialHttpsUrlSchema,
  paginationQuerySchema,
  requestIdSchema,
  supportedLanguageSchema,
} from './common.js';
import { createSuccessEnvelopeSchema, healthCheckPayloadSchema } from './envelope.js';

describe('@janasahayak/validation', () => {
  it('accepts valid supported languages and rejects unsupported ones', () => {
    assert.equal(supportedLanguageSchema.parse('en'), 'en');
    assert.equal(supportedLanguageSchema.parse('hi'), 'hi');
    assert.equal(supportedLanguageSchema.parse('kn'), 'kn');
    assert.throws(() => supportedLanguageSchema.parse('fr'));
  });

  it('validates opaque cursor and limit defaults for pagination', () => {
    assert.deepEqual(paginationQuerySchema.parse({}), { limit: 20 });
    assert.deepEqual(paginationQuerySchema.parse({ cursor: 'abc_123-XYZ', limit: '50' }), {
      cursor: 'abc_123-XYZ',
      limit: 50,
    });
    assert.throws(() => paginationQuerySchema.parse({ limit: 101 }));
    assert.throws(() => paginationQuerySchema.parse({ cursor: 'bad cursor!' }));
  });

  it('enforces safe request IDs', () => {
    assert.equal(
      requestIdSchema.parse('550e8400-e29b-41d4-a716-446655440000'),
      '550e8400-e29b-41d4-a716-446655440000',
    );
    assert.throws(() => requestIdSchema.parse('short'));
    assert.throws(() => requestIdSchema.parse('bad\nheader-injection'));
  });

  it('requires HTTPS for official source URLs', () => {
    assert.equal(
      officialHttpsUrlSchema.parse('https://sevasindhu.karnataka.gov.in'),
      'https://sevasindhu.karnataka.gov.in',
    );
    assert.throws(() => officialHttpsUrlSchema.parse('http://example.gov.in'));
    assert.throws(() => officialHttpsUrlSchema.parse('javascript:alert(1)'));
  });

  it('validates health success envelopes', () => {
    const schema = createSuccessEnvelopeSchema(healthCheckPayloadSchema);
    const parsed = schema.parse({
      data: {
        status: 'ok',
        service: 'janasahayak-api',
        version: '0.1.0',
        timestamp: '2026-11-17T12:00:00.000Z',
      },
      meta: {
        requestId: '550e8400-e29b-41d4-a716-446655440000',
      },
    });
    assert.equal(parsed.data.status, 'ok');
  });
});
