import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { buildApp } from '../app.js';

describe('Phase 13 Advanced Features API Routes', () => {
  let app: FastifyInstance;

  const mockDb: Queryable = {
    query: async (sql, _values) => {
      const sqlStr = String(sql);

      // Deadlines queries
      if (sqlStr.includes('FROM deadlines d')) {
        return {
          rows: [
            {
              id: 'dl000000-0000-0000-0000-000000000001',
              service_id: 'e0000000-0000-0000-0000-000000000001',
              service_slug: 'post-matric-scholarship',
              service_title: 'Post-Matric Scholarship',
              category: 'SCHOLARSHIP',
              state_code: 'KA',
              name: 'Academic Year 2026-27 Application Deadline',
              opens_at: '2026-08-01T00:00:00Z',
              closes_at: '2026-12-31T23:59:59Z',
              status: 'OPEN',
              source_url: 'https://ssp.postmatric.karnataka.gov.in',
              publisher: 'Social Welfare Department',
              last_verified_at: '2026-11-15T00:00:00Z',
            },
          ],
        };
      }

      // Locations queries
      if (sqlStr.includes('FROM locations l')) {
        return {
          rows: [
            {
              id: 'loc00000-0000-0000-0000-000000000001',
              name: 'Bangalore One — Koramangala Civic Centre',
              center_type: 'B1_K1_CENTRE',
              address: '80 Feet Road, 4th Block, Koramangala, Bengaluru',
              district: 'Bengaluru Urban',
              taluk: 'Bengaluru South',
              state_code: 'KA',
              pincode: '560034',
              latitude: '12.934400',
              longitude: '77.625600',
              contact_phone: '080-22967111',
              operating_hours: 'Mon-Sat 8am-7pm',
              verified_source_url: 'https://karnataka.gov.in/bangaloreone',
              is_active: true,
              created_at: '2026-01-01T00:00:00Z',
              updated_at: '2026-01-01T00:00:00Z',
              services_json: [
                {
                  service_id: 'e0000000-0000-0000-0000-000000000001',
                  slug: 'post-matric-scholarship',
                  title: 'Post-Matric Scholarship',
                  assistance_type: 'BIOMETRIC_EKYC',
                },
              ],
            },
          ],
        };
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
      db: mockDb,
      logger: false,
      checkDatabase: async () => 'up',
    });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  describe('Deadlines Endpoints', () => {
    it('GET /api/v1/deadlines returns list of deadlines with status', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/deadlines?status=ALL',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data.length, 1);
      assert.equal(body.data[0].serviceSlug, 'post-matric-scholarship');
      assert.ok(body.meta.requestId);
    });

    it('GET /api/v1/services/:id/deadlines returns deadlines for service', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services/post-matric-scholarship/deadlines',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data[0].id, 'dl000000-0000-0000-0000-000000000001');
    });
  });

  describe('Locations Endpoints', () => {
    it('GET /api/v1/locations returns verified help desks', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/locations?district=Bengaluru Urban',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data[0].centerType, 'B1_K1_CENTRE');
      assert.equal(body.data[0].supportedServices.length, 1);
    });

    it('GET /api/v1/locations rejects invalid PIN code with 400', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/locations?pincode=123',
      });

      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.payload);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });

    it('GET /api/v1/services/:id/locations returns locations offering service assistance', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/services/post-matric-scholarship/locations',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.ok(Array.isArray(body.data));
      assert.equal(body.data[0].name, 'Bangalore One — Koramangala Civic Centre');
    });
  });

  describe('Life Events Endpoints', () => {
    it('GET /api/v1/life-events returns all 5 life transition bundles', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/life-events',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.data.length, 5);
      assert.equal(body.data[0].key, 'EDUCATION_HIGHER');
      assert.ok(body.data[0].title.kn);
    });

    it('GET /api/v1/life-events/:key returns single life event bundle', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/life-events/EDUCATION_HIGHER',
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.data.key, 'EDUCATION_HIGHER');
      assert.ok(body.data.serviceBundles.length >= 1);
    });

    it('GET /api/v1/life-events/:key returns 404 for unknown life event', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/life-events/NON_EXISTENT',
      });

      assert.equal(res.statusCode, 404);
      const body = JSON.parse(res.payload);
      assert.equal(body.error.code, 'NOT_FOUND');
    });
  });

  describe('Family Mode Endpoints', () => {
    it('POST /api/v1/family/scan returns multi-member scheme suggestions', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/family/scan',
        payload: {
          members: [
            {
              name: 'Radha',
              relationship: 'SELF',
              age: 38,
              gender: 'FEMALE',
              occupation: 'Homemaker',
              educationLevel: '10th Standard',
              annualIncome: 150000,
            },
            {
              name: 'Kavya',
              relationship: 'CHILD',
              age: 18,
              gender: 'FEMALE',
              occupation: 'Student',
              educationLevel: 'PUC 2nd Year',
              annualIncome: 0,
            },
          ],
        },
      });

      assert.equal(res.statusCode, 200);
      const body = JSON.parse(res.payload);
      assert.equal(body.data.scannedCount, 2);
      assert.ok(body.data.totalEligibleFound >= 2);
      assert.ok(body.data.privacyDisclaimer);
    });

    it('POST /api/v1/family/scan rejects Aadhaar-like number in family profile with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/family/scan',
        payload: {
          members: [
            {
              name: 'Radha 2345 6789 0123',
              relationship: 'SELF',
              age: 38,
              gender: 'FEMALE',
            },
          ],
        },
      });

      assert.equal(res.statusCode, 400);
      const body = JSON.parse(res.payload);
      assert.equal(body.error.code, 'VALIDATION_ERROR');
    });
  });
});
