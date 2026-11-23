import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { afterEach, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { apiErrorResponseSchema } from '@janasahayak/validation';
import { buildApp } from './app.js';

interface MockServiceRow {
  id: string;
  slug: string;
  service_type: string;
  title: string;
  short_description: string;
  department_name: string;
  state_code: string | null;
  status: string;
  current_version_id: string | null;
  created_at: Date;
  updated_at: Date;
}

interface MockSourceRow {
  id: string;
  service_id: string;
  source_url: string;
  source_type: string;
  publisher: string;
  retrieved_at: Date;
  last_verified_at: Date;
  verification_status: string;
  review_notes: string | null;
}

function createMockDatabase(): Queryable {
  const serviceId = '00000000-0000-0000-0000-000000000099';
  const docId = 'd0000000-0000-0000-0000-000000000001';
  const now = new Date();

  const services: MockServiceRow[] = [
    {
      id: serviceId,
      slug: 'security-test-service',
      service_type: 'WELFARE',
      title: 'Security Test Service',
      short_description: 'Used for security integration tests',
      department_name: 'Security Dept',
      state_code: 'KA',
      status: 'DRAFT',
      current_version_id: null,
      created_at: now,
      updated_at: now,
    },
  ];

  const sources: MockSourceRow[] = [];

  return {
    query: async (sqlText: string, params: unknown[] = []) => {
      const sql = String(sqlText).trim();

      // SELECT FROM service_records WHERE id = $1
      if (sql.includes('FROM service_records') && sql.includes('WHERE id = $1')) {
        const found = services.find((s) => s.id === params[0]);
        return { rows: found ? [found] : [] };
      }

      // INSERT INTO service_sources
      if (sql.includes('INSERT INTO service_sources')) {
        const row: MockSourceRow = {
          id: crypto.randomUUID(),
          service_id: String(params[0]),
          source_url: String(params[1]),
          source_type: String(params[2]),
          publisher: String(params[3]),
          retrieved_at: now,
          last_verified_at: now,
          verification_status: String(params[4]),
          review_notes: (params[5] as string) ?? null,
        };
        sources.push(row);
        return { rows: [row] };
      }

      // INSERT INTO audit_logs
      if (sql.includes('INSERT INTO audit_logs')) {
        return {
          rows: [
            {
              id: crypto.randomUUID(),
              actor_id: params[0] ?? null,
              action: params[1],
              resource_type: params[2],
              resource_id: params[3] ?? null,
              metadata: params[4] ?? {},
              created_at: now,
            },
          ],
        };
      }

      // findDocumentById query
      if (sql.includes('FROM documents d')) {
        const idParam = params?.[0];
        if (idParam === docId || idParam === 'income-certificate') {
          return {
            rows: [
              {
                id: docId,
                name: 'Income Certificate',
                description: 'Official revenue certificate',
                document_type: 'CERTIFICATE',
                issuer_id: 'i1',
                issuing_guide: {
                  purpose: { en: 'Proves income' },
                  prerequisites: [{ name: 'Ration Card', description: { en: 'For family proof' } }],
                  issuingAuthority: {
                    name: 'Nadakacheri',
                    department: 'Revenue Dept',
                    portalUrl: 'https://nadakacheri.karnataka.gov.in',
                    physicalOffices: 'Nadakacheri Centres',
                    helpline: '080-22370281',
                  },
                  processingTimeDays: 14,
                  fees: { en: '₹25' },
                  validityPeriod: { en: '5 years' },
                  steps: [
                    {
                      stepNumber: 1,
                      title: 'Apply',
                      description: { en: 'Online' },
                      officialUrl: 'https://nadakacheri.karnataka.gov.in',
                    },
                  ],
                },
                created_at: now,
                updated_at: now,
                issuer_pk: 'i1',
                issuer_name: 'Nadakacheri',
                issuer_category: 'STATE_DEPARTMENT',
                portal_url: 'https://nadakacheri.karnataka.gov.in',
                issuer_created_at: now,
              },
            ],
          };
        }
        return { rows: [] };
      }

      return { rows: [] };
    },
  };
}

describe('@janasahayak/api Security Hardening Integration', () => {
  const openApps: FastifyInstance[] = [];

  async function createTestApp(overrides: Record<string, string | undefined> = {}) {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
      ...overrides,
    });
    const db = createMockDatabase();
    const app = await buildApp({
      env,
      db,
      logger: false,
      checkDatabase: async () => 'up',
    });
    openApps.push(app);
    return { app, db };
  }

  afterEach(async () => {
    while (openApps.length > 0) {
      const app = openApps.pop();
      if (app) {
        await app.close();
      }
    }
  });

  describe('SSRF Protections on Source Submission', () => {
    const serviceId = '00000000-0000-0000-0000-000000000099';

    const dangerousUrls = [
      'http://karnataka.gov.in/portal', // Insecure protocol (http)
      'https://127.0.0.1:8080/admin', // Loopback IPv4
      'https://127.0.0.2/secret', // Loopback subnet
      'https://localhost:3000/api', // Localhost hostname
      'https://[::1]/internal', // IPv6 loopback
      'https://169.254.169.254/latest/meta-data', // AWS/OpenStack instance metadata
      'https://metadata.google.internal/computeMetadata/v1', // GCP metadata
      'https://10.0.0.1/intranet', // RFC 1918 Class A private
      'https://172.16.5.1/intranet', // RFC 1918 Class B private
      'https://172.31.255.254/intranet', // RFC 1918 Class B private boundary
      'https://192.168.1.100/router', // RFC 1918 Class C private
      'https://karnataka.gov.in:5432/db', // Blocked Postgres port
      'https://karnataka.gov.in:6379/redis', // Blocked Redis port
      'https://karnataka.gov.in:22/ssh', // Blocked SSH port
    ];

    for (const url of dangerousUrls) {
      it(`blocks dangerous or internal SSRF target: ${url}`, async () => {
        const { app } = await createTestApp();
        const response = await app.inject({
          method: 'POST',
          url: `/api/v1/admin/services/${serviceId}/sources`,
          headers: {
            'content-type': 'application/json',
            authorization: 'Bearer mock-editor-token',
          },
          payload: {
            sourceUrl: url,
            sourceType: 'OFFICIAL_PORTAL',
            publisher: 'Karnataka State Portal',
            verificationStatus: 'VERIFIED',
          },
        });

        assert.equal(response.statusCode, 400);
        const body = apiErrorResponseSchema.parse(response.json());
        assert.equal(body.error.code, 'VALIDATION_ERROR');
      });
    }

    it('allows safe, public government HTTPS URL', async () => {
      const { app } = await createTestApp();
      const response = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/sources`,
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer mock-editor-token',
        },
        payload: {
          sourceUrl: 'https://karnataka.gov.in/service/ration-card',
          sourceType: 'OFFICIAL_PORTAL',
          publisher: 'Food & Civil Supplies Department',
          verificationStatus: 'VERIFIED',
        },
      });

      assert.equal(response.statusCode, 201);
      const body = response.json();
      assert.equal(body.data.sourceUrl, 'https://karnataka.gov.in/service/ration-card');
    });
  });

  describe('Open-Redirect & Input Sanitization Protections', () => {
    const maliciousReturnPaths = [
      '//evil.com',
      '//phishing.gov.in.attacker.com',
      'https://evil.com/login',
      'http://attacker.com',
      'javascript:alert(1)',
      'data:text/html,evil',
      '/services/test\r\nX-Injected: true',
      '/services/test\u0000nullbyte',
    ];

    for (const target of maliciousReturnPaths) {
      it(`blocks open-redirect or dangerous returnTo query: ${target}`, async () => {
        const { app } = await createTestApp();
        const response = await app.inject({
          method: 'GET',
          url: `/api/v1/documents/d0000000-0000-0000-0000-000000000001?returnTo=${encodeURIComponent(target)}`,
        });

        assert.equal(response.statusCode, 400);
        const body = apiErrorResponseSchema.parse(response.json());
        assert.equal(body.error.code, 'VALIDATION_ERROR');
      });
    }

    it('accepts safe relative path in returnTo query', async () => {
      const { app } = await createTestApp();
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/documents/d0000000-0000-0000-0000-000000000001?returnTo=/services/ration-card',
      });

      assert.equal(response.statusCode, 200);
      const body = response.json();
      assert.equal(body.data.id, 'd0000000-0000-0000-0000-000000000001');
    });
  });

  describe('Security Headers & Cache-Control Enforcement', () => {
    it('sets strict defensive security headers on all responses', async () => {
      const { app } = await createTestApp();
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });

      assert.equal(response.statusCode, 200);
      assert.equal(response.headers['x-content-type-options'], 'nosniff');
      assert.equal(response.headers['x-frame-options'], 'DENY');
      assert.equal(response.headers['referrer-policy'], 'strict-origin-when-cross-origin');
      assert.match(String(response.headers['permissions-policy']), /camera=\(\)/);
      assert.match(String(response.headers['permissions-policy']), /geolocation=\(\)/);
      assert.match(String(response.headers['permissions-policy']), /microphone=\(\)/);
      assert.match(String(response.headers['permissions-policy']), /payment=\(\)/);
      assert.match(String(response.headers['content-security-policy']), /default-src 'none'/);
    });

    it('sets no-store cache control headers on operational and admin routes', async () => {
      const { app } = await createTestApp();

      const healthRes = await app.inject({ method: 'GET', url: '/api/v1/health' });
      assert.equal(
        healthRes.headers['cache-control'],
        'no-store, no-cache, must-revalidate, private',
      );
      assert.equal(healthRes.headers['pragma'], 'no-cache');

      const adminRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/services/00000000-0000-0000-0000-000000000099/history',
        headers: { authorization: 'Bearer mock-editor-token' },
      });
      assert.equal(
        adminRes.headers['cache-control'],
        'no-store, no-cache, must-revalidate, private',
      );
      assert.equal(adminRes.headers['pragma'], 'no-cache');
    });
  });

  describe('RBAC Server-Side Enforcement & Security Audit', () => {
    it('rejects unauthenticated admin access with 401 and clean error envelope', async () => {
      const { app } = await createTestApp();
      const response = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/audit-logs',
      });

      assert.equal(response.statusCode, 401);
      const body = apiErrorResponseSchema.parse(response.json());
      assert.equal(body.error.code, 'UNAUTHORIZED');
      assert.equal(typeof body.meta.requestId, 'string');
    });

    it('rejects role escalation attempts with 403 FORBIDDEN', async () => {
      const { app } = await createTestApp();

      // CONTENT_EDITOR attempting to access security audit logs (restricted to ADMIN, SECURITY_ADMIN)
      const auditRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/audit-logs',
        headers: { authorization: 'Bearer mock-editor-token' },
      });
      assert.equal(auditRes.statusCode, 403);
      const auditBody = apiErrorResponseSchema.parse(auditRes.json());
      assert.equal(auditBody.error.code, 'FORBIDDEN');

      // CONTENT_EDITOR attempting to publish a service (restricted to CONTENT_REVIEWER, ADMIN)
      const publishRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/services/00000000-0000-0000-0000-000000000099/publish',
        headers: {
          'content-type': 'application/json',
          authorization: 'Bearer mock-editor-token',
        },
        payload: {},
      });
      assert.equal(publishRes.statusCode, 403);
      const pubBody = apiErrorResponseSchema.parse(publishRes.json());
      assert.equal(pubBody.error.code, 'FORBIDDEN');
    });
  });
});
