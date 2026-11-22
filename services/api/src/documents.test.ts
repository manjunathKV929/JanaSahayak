import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { buildApp } from './app.js';

describe('@janasahayak/api Documents Routes', () => {
  let app: FastifyInstance;
  const fakeDate = new Date('2026-11-10T00:00:00Z');

  const mockDb: Queryable = {
    query: async (sql, params) => {
      const sqlStr = String(sql);

      // findDocumentById query
      if (sqlStr.includes('FROM documents d')) {
        const idParam = params?.[0];
        if (
          idParam === 'd0000000-0000-0000-0000-000000000001' ||
          idParam === 'income-certificate'
        ) {
          return {
            rows: [
              {
                id: 'd0000000-0000-0000-0000-000000000001',
                name: 'Income Certificate (Form F / RD)',
                description: 'Official revenue certificate',
                document_type: 'CERTIFICATE',
                issuer_id: 'i1',
                issuing_guide: {
                  purpose: { en: 'Proves income for scholarships' },
                  prerequisites: [{ name: 'Ration Card', description: { en: 'For family proof' } }],
                  issuingAuthority: {
                    name: 'Nadakacheri',
                    department: 'Revenue Department',
                    portalUrl: 'https://nadakacheri.karnataka.gov.in',
                    physicalOffices: 'Nadakacheri Centres',
                    helpline: '080-22370281',
                  },
                  processingTimeDays: 14,
                  fees: { en: '₹25 user fee' },
                  validityPeriod: { en: 'Valid for 5 years' },
                  steps: [
                    { stepNumber: 1, title: 'Gather Documents', description: { en: 'Keep ready' } },
                    {
                      stepNumber: 2,
                      title: 'Apply Online',
                      description: { en: 'Visit Nadakacheri' },
                      officialUrl: 'https://nadakacheri.karnataka.gov.in',
                    },
                  ],
                },
                created_at: fakeDate,
                updated_at: fakeDate,
                issuer_pk: 'i1',
                issuer_name: 'Nadakacheri',
                issuer_category: 'STATE_DEPARTMENT',
                portal_url: 'https://nadakacheri.karnataka.gov.in',
                issuer_created_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      }

      // getDocumentsForService query
      if (sqlStr.includes('SELECT id FROM service_records WHERE slug = $1')) {
        const slug = params?.[0];
        if (slug === 'synthetic-post-matric-scholarship') {
          return { rows: [{ id: 's1' }] };
        }
        return { rows: [] };
      }

      if (sqlStr.includes('FROM service_documents sd')) {
        const sId = params?.[0];
        if (sId === 's1') {
          return {
            rows: [
              {
                id: 'd0000000-0000-0000-0000-000000000001',
                name: 'Income Certificate (Form F / RD)',
                description: 'Official revenue certificate',
                document_type: 'CERTIFICATE',
                issuer_id: 'i1',
                issuing_guide: null,
                is_required: true,
                conditions: null,
                display_order: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
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

  test('GET /api/v1/documents/:id returns full document guide', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/documents/d0000000-0000-0000-0000-000000000001',
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.id, 'd0000000-0000-0000-0000-000000000001');
    assert.equal(body.data.name, 'Income Certificate (Form F / RD)');
    assert.ok(body.data.guide);
    assert.equal(body.data.guide.processingTimeDays, 14);
    assert.equal(body.data.guide.issuingAuthority.name, 'Nadakacheri');
    assert.equal(body.data.guide.steps.length, 2);
    assert.ok(body.meta.requestId);
  });

  test('GET /api/v1/documents/:id returns 404 for unknown document', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/documents/unknown-doc',
    });

    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.payload);
    assert.equal(body.error.code, 'NOT_FOUND');
  });

  test('GET /api/v1/services/:id/documents returns service documents checklist', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services/synthetic-post-matric-scholarship/documents',
    });

    assert.equal(res.statusCode, 200);
    const body = JSON.parse(res.payload);
    assert.equal(body.data.length, 1);
    assert.equal(body.data[0].name, 'Income Certificate (Form F / RD)');
    assert.equal(body.data[0].isRequired, true);
    assert.equal(body.meta.total, 1);
  });

  test('GET /api/v1/services/:id/documents returns 404 for unknown service', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services/unknown-service-slug/documents',
    });

    assert.equal(res.statusCode, 404);
    const body = JSON.parse(res.payload);
    assert.equal(body.error.code, 'NOT_FOUND');
  });
});
