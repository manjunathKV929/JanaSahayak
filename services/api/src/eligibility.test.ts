import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { buildApp } from './app.js';

describe('@janasahayak/api Eligibility Routes', () => {
  let app: FastifyInstance;

  const mockQuestions = [
    {
      id: 'q1',
      service_id: 's1',
      key: 'stateDomicile',
      question_text: { en: 'Are you a permanent resident of Karnataka?' },
      answer_type: 'boolean',
      required: true,
      display_order: 1,
    },
    {
      id: 'q2',
      service_id: 's1',
      key: 'annualIncome',
      question_text: { en: 'What is your annual family income?' },
      answer_type: 'number',
      required: true,
      display_order: 2,
    },
  ];

  const mockRules = [
    {
      id: 'r1',
      service_id: 's1',
      name: 'Karnataka Domicile Rule',
      rule_expression: { field: 'stateDomicile', operator: '==', value: true },
      explanation: {
        en: 'Candidate must be a permanent resident of Karnataka.',
        kn: 'ಅಭ್ಯರ್ಥಿಯು ಕರ್ನಾಟಕದ ನಿವಾಸಿಯಾಗಿರಬೇಕು.',
      },
      priority: 1,
      created_at: new Date(),
      updated_at: new Date(),
    },
    {
      id: 'r2',
      service_id: 's1',
      name: 'Income Limit Rule',
      rule_expression: { field: 'annualIncome', operator: '<=', value: 250000 },
      explanation: {
        en: 'Annual family income must not exceed ₹2,50,000.',
      },
      priority: 2,
      created_at: new Date(),
      updated_at: new Date(),
    },
  ];

  const mockDb: Queryable = {
    query: async (sql, params) => {
      const sqlStr = String(sql);

      // Check service by slug
      if (sqlStr.includes('SELECT id FROM service_records WHERE slug = $1')) {
        const slug = params?.[0];
        if (slug === 'synthetic-post-matric-scholarship') {
          return { rows: [{ id: 's1' }] };
        }
        return { rows: [] };
      }

      // Check questions query
      if (sqlStr.includes('FROM eligibility_questions')) {
        const serviceId = params?.[0];
        if (serviceId === 's1') {
          return { rows: mockQuestions };
        }
        return { rows: [] };
      }

      // Check options query
      if (sqlStr.includes('FROM eligibility_options')) {
        return { rows: [] };
      }

      // Check rules query
      if (sqlStr.includes('FROM eligibility_rules')) {
        const serviceId = params?.[0];
        if (serviceId === 's1') {
          return { rows: mockRules };
        }
        return { rows: [] };
      }

      return { rows: [] };
    },
  };

  before(async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });

    app = await buildApp({
      env,
      logger: false,
      db: mockDb,
      checkDatabase: async () => 'healthy',
    });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  test('GET /api/v1/services/:id/eligibility/questions returns questionnaire', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services/s1/eligibility/questions',
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.ok(body.data);
    assert.equal(body.data.serviceIdentifier, 's1');
    assert.equal(body.data.questions.length, 2);
    assert.equal(body.data.questions[0].key, 'stateDomicile');
    assert.equal(body.data.questions[0].answerType, 'boolean');
    assert.ok(body.meta.requestId);
  });

  test('GET /api/v1/services/:id/eligibility/questions supports slug lookup', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services/synthetic-post-matric-scholarship/eligibility/questions',
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.questions.length, 2);
  });

  test('GET /api/v1/services/:id/eligibility/questions returns 404 for unknown service', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services/unknown-service-slug/eligibility/questions',
    });

    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.payload);
    assert.equal(body.error.code, 'SERVICE_NOT_FOUND');
  });

  test('POST /api/v1/services/:id/eligibility/evaluate returns POTENTIALLY_ELIGIBLE', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/services/synthetic-post-matric-scholarship/eligibility/evaluate',
      payload: {
        answers: {
          stateDomicile: true,
          annualIncome: 180000,
        },
        language: 'en',
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.result, 'POTENTIALLY_ELIGIBLE');
    assert.equal(body.data.matchedRules.length, 2);
    assert.equal(body.data.unmatchedRules.length, 0);
    assert.ok(body.data.disclaimer.includes('Final eligibility'));
  });

  test('POST /api/v1/services/:id/eligibility/evaluate returns UNLIKELY_ELIGIBLE when criteria fail', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/services/s1/eligibility/evaluate',
      payload: {
        answers: {
          stateDomicile: true,
          annualIncome: 350000, // exceeds ceiling
        },
        language: 'en',
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.result, 'UNLIKELY_ELIGIBLE');
    assert.equal(body.data.matchedRules.length, 1);
    assert.equal(body.data.unmatchedRules.length, 1);
    assert.equal(body.data.unmatchedRules[0].status, 'FAILED');
  });

  test('POST /api/v1/services/:id/eligibility/evaluate returns INCOMPLETE_INFO when answers missing', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/services/s1/eligibility/evaluate',
      payload: {
        answers: {
          stateDomicile: true,
          // annualIncome missing
        },
      },
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.result, 'INCOMPLETE_INFO');
    assert.deepEqual(body.data.missingFields, ['annualIncome']);
  });

  test('POST /api/v1/services/:id/eligibility/evaluate returns 400 for invalid answers payload', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/services/s1/eligibility/evaluate',
      payload: {
        answers: 'not-an-object',
      },
    });

    assert.equal(res.statusCode, 400);
    const body = JSON.parse(res.payload);
    assert.ok(['VALIDATION_ERROR', 'INVALID_INPUT'].includes(body.error.code));
  });
});
