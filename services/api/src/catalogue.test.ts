import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { buildApp } from './app.js';

function createMockCatalogueDatabase(): Queryable {
  return {
    query: async (sqlText: string, params: unknown[] = []) => {
      const sql = String(sqlText).trim();

      // COUNT(*) query for services
      if (sql.includes('SELECT COUNT(*)') && sql.includes("sr.status = 'PUBLISHED'")) {
        return { rows: [{ total: 2 }] };
      }

      // SELECT services search/list
      if (
        sql.includes('SELECT') &&
        sql.includes('FROM service_records sr') &&
        sql.includes("sr.status = 'PUBLISHED'")
      ) {
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-post-matric-scholarship',
              service_type: 'SCHEME',
              title: '[Synthetic Sample] Post-Matric Scholarship Scheme (Karnataka)',
              short_description:
                'Financial assistance for eligible post-matriculation students pursuing higher education.',
              department_name: 'Social Welfare Department',
              state_code: 'KA',
              verification_status: 'VERIFIED',
              last_verified_at: new Date('2026-11-17T00:00:00Z'),
              updated_at: new Date('2026-11-17T00:00:00Z'),
            },
            {
              id: '22222222-2222-2222-2222-222222222222',
              slug: 'synthetic-senior-citizen-card',
              service_type: 'CERTIFICATE',
              title: '[Synthetic Sample] Senior Citizen Identity Card (Karnataka)',
              short_description:
                'Identity card issuing process for senior citizens residing in Karnataka.',
              department_name:
                'Directorate for the Empowerment of Differently Abled and Senior Citizens',
              state_code: 'KA',
              verification_status: 'VERIFIED',
              last_verified_at: new Date('2026-11-17T00:00:00Z'),
              updated_at: new Date('2026-11-17T00:00:00Z'),
            },
          ],
        };
      }

      // SELECT service by slug
      if (
        sql.includes('FROM service_records') &&
        sql.includes("WHERE slug = $1 AND status = 'PUBLISHED'")
      ) {
        const slug = String(params[0]);
        if (slug === 'synthetic-post-matric-scholarship') {
          return {
            rows: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                slug: 'synthetic-post-matric-scholarship',
                service_type: 'SCHEME',
                title: '[Synthetic Sample] Post-Matric Scholarship Scheme (Karnataka)',
                short_description:
                  'Financial assistance for eligible post-matriculation students pursuing higher education.',
                department_name: 'Social Welfare Department',
                state_code: 'KA',
                status: 'PUBLISHED',
                current_version_id: '33333333-3333-3333-3333-333333333333',
                created_at: new Date('2026-11-10T00:00:00Z'),
                updated_at: new Date('2026-11-17T00:00:00Z'),
              },
            ],
          };
        }
        return { rows: [] };
      }

      // SELECT version
      if (sql.includes('FROM service_versions') && sql.includes('WHERE id = $1')) {
        return {
          rows: [
            {
              id: '33333333-3333-3333-3333-333333333333',
              service_id: '11111111-1111-1111-1111-111111111111',
              version_number: 1,
              content: {
                summary: 'Comprehensive financial aid for post-matric Karnataka students.',
                benefits: 'Maintenance allowance and reimbursement of non-refundable fees.',
              },
              language: 'en',
              effective_from: '2026-04-01',
              effective_to: null,
              created_by: '44444444-4444-4444-4444-444444444444',
              approved_by: '55555555-5555-5555-5555-555555555555',
              created_at: new Date('2026-11-15T00:00:00Z'),
            },
          ],
        };
      }

      // SELECT sources
      if (sql.includes('FROM service_sources') && sql.includes('WHERE service_id = $1')) {
        return {
          rows: [
            {
              id: '66666666-6666-6666-6666-666666666666',
              service_id: '11111111-1111-1111-1111-111111111111',
              source_url: 'https://ssp.postmatric.karnataka.gov.in',
              source_type: 'OFFICIAL_PORTAL',
              publisher: 'Karnataka State Scholarship Portal',
              verification_status: 'VERIFIED',
              last_verified_at: new Date('2026-11-17T00:00:00Z'),
              retrieved_at: new Date('2026-11-17T00:00:00Z'),
            },
          ],
        };
      }

      // SELECT documents
      if (sql.includes('FROM service_documents sd')) {
        return {
          rows: [
            {
              id: 'doc-1',
              name: 'Income Certificate',
              description: 'Annual family income certificate issued by Tahsildar.',
              document_type: 'CERTIFICATE',
              issuer_id: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };
      }

      // SELECT rules
      if (sql.includes('FROM eligibility_rules')) {
        return {
          rows: [
            {
              id: 'rule-1',
              service_id: '11111111-1111-1111-1111-111111111111',
              name: 'Karnataka Domicile',
              rule_expression: { field: 'state', operator: '==', value: 'KA' },
              explanation: { en: 'Applicant must be a permanent resident of Karnataka' },
              priority: 1,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };
      }

      // SELECT journey
      if (sql.includes('FROM journeys')) {
        return {
          rows: [
            {
              id: 'journey-1',
              service_id: '11111111-1111-1111-1111-111111111111',
              title: 'Scholarship Application Guidance',
              description: 'Step-by-step guidance to apply on State Scholarship Portal.',
              version: 1,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };
      }

      // SELECT journey_steps
      if (sql.includes('FROM journey_steps')) {
        return {
          rows: [
            {
              id: 'step-1',
              journey_id: 'journey-1',
              step_key: 'verify-aadhaar',
              title: 'e-Attestation of Certificates',
              description: { en: 'Get academic marks card and caste certificate e-attested.' },
              step_type: 'DOCUMENT_CHECK',
              display_order: 1,
              official_url: 'https://eattestation.karnataka.gov.in',
              completion_rule: null,
            },
          ],
        };
      }

      // SELECT deadlines
      if (sql.includes('FROM deadlines')) {
        return {
          rows: [
            {
              id: 'dl-1',
              service_id: '11111111-1111-1111-1111-111111111111',
              name: 'SSP Application Window 2026-27',
              opens_at: new Date('2026-06-01T00:00:00Z'),
              closes_at: new Date('2026-10-31T23:59:59Z'),
              source_id: '66666666-6666-6666-6666-666666666666',
              status: 'OPEN',
            },
          ],
        };
      }

      // SELECT categories
      if (sql.includes('GROUP BY service_type')) {
        return {
          rows: [
            { category: 'SCHEME', count: 1 },
            { category: 'CERTIFICATE', count: 1 },
          ],
        };
      }

      return { rows: [] };
    },
  };
}

describe('@janasahayak/api Public Catalogue Routes', () => {
  const env = loadApiEnv({
    NODE_ENV: 'test',
    API_CORS_ORIGINS: 'http://localhost:3000',
  });

  test('GET /api/v1/services returns paginated list of published services with verification metadata', async () => {
    const db = createMockCatalogueDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services?q=scholarship&state=KA&limit=10',
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(Array.isArray(json.data));
      assert.equal(json.data.length, 2);
      assert.equal(json.data[0].slug, 'synthetic-post-matric-scholarship');
      assert.equal(json.data[0].verification.status, 'VERIFIED');
      assert.equal(json.meta.total, 2);
      assert.equal(json.meta.hasMore, false);
      assert.ok(json.meta.requestId);
    } finally {
      await app.close();
    }
  });

  test('GET /api/v1/services rejects invalid query parameters with 400', async () => {
    const db = createMockCatalogueDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services?limit=500', // exceeds max 100
      });

      assert.equal(res.statusCode, 400);
      const json = JSON.parse(res.body);
      assert.equal(json.error.code, 'VALIDATION_ERROR');
    } finally {
      await app.close();
    }
  });

  test('GET /api/v1/services/:slug returns full public service details without private notes', async () => {
    const db = createMockCatalogueDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services/synthetic-post-matric-scholarship',
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(json.data.service);
      assert.equal(
        json.data.service.title,
        '[Synthetic Sample] Post-Matric Scholarship Scheme (Karnataka)',
      );
      assert.ok(json.data.version);
      assert.equal(json.data.sources.length, 1);
      assert.equal(json.data.sources[0].sourceUrl, 'https://ssp.postmatric.karnataka.gov.in');
      assert.equal('reviewNotes' in json.data.sources[0], false);
      assert.equal(json.data.documents.length, 1);
      assert.equal(json.data.rules.length, 1);
      assert.equal(json.data.journey.steps.length, 1);
      assert.equal(json.data.deadlines.length, 1);
    } finally {
      await app.close();
    }
  });

  test('GET /api/v1/services/:slug returns 404 for unknown slug', async () => {
    const db = createMockCatalogueDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services/non-existent-service-slug',
      });

      assert.equal(res.statusCode, 404);
      const json = JSON.parse(res.body);
      assert.equal(json.error.code, 'NOT_FOUND');
    } finally {
      await app.close();
    }
  });

  test('GET /api/v1/services/:id/sources returns public sources', async () => {
    const db = createMockCatalogueDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services/11111111-1111-1111-1111-111111111111/sources',
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(Array.isArray(json.data));
      assert.equal(json.data.length, 1);
      assert.equal(json.data[0].publisher, 'Karnataka State Scholarship Portal');
    } finally {
      await app.close();
    }
  });

  test('GET /api/v1/categories returns list of categories with service count', async () => {
    const db = createMockCatalogueDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/categories',
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(Array.isArray(json.data));
      assert.equal(json.data.length, 2);
      assert.equal(json.data[0].category, 'SCHEME');
      assert.equal(json.data[0].count, 1);
    } finally {
      await app.close();
    }
  });
});
