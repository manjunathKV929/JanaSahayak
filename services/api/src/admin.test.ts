import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import test, { describe } from 'node:test';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
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

interface MockVersionRow {
  id: string;
  service_id: string;
  version_number: number;
  content: Record<string, unknown>;
  language: string;
  effective_from: string | null;
  effective_to: string | null;
  created_by: string;
  approved_by: string | null;
  created_at: Date;
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

interface MockReviewRow {
  id: string;
  service_id: string;
  reviewer_id: string | null;
  decision: string;
  notes: string | null;
  reviewed_at: Date;
}

interface MockAuditRow {
  id: string;
  actor_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  metadata: Record<string, unknown>;
  created_at: Date;
}

function createInMemoryDatabase(): Queryable {
  const services: MockServiceRow[] = [];
  const versions: MockVersionRow[] = [];
  const sources: MockSourceRow[] = [];
  const reviews: MockReviewRow[] = [];
  const auditLogs: MockAuditRow[] = [];

  return {
    query: async (sqlText: string, params: unknown[] = []) => {
      const sql = String(sqlText).trim();

      // INSERT INTO service_records
      if (sql.includes('INSERT INTO service_records')) {
        const id = crypto.randomUUID();
        const now = new Date();
        const row: MockServiceRow = {
          id,
          slug: String(params[0]),
          service_type: String(params[1]),
          title: String(params[2]),
          short_description: String(params[3]),
          department_name: String(params[4]),
          state_code: (params[5] as string) ?? null,
          status: 'DRAFT',
          current_version_id: null,
          created_at: now,
          updated_at: now,
        };
        services.push(row);
        return { rows: [row] };
      }

      // SELECT FROM service_records WHERE id = $1
      if (sql.includes('FROM service_records') && sql.includes('WHERE id = $1')) {
        const found = services.find((s) => s.id === params[0]);
        return { rows: found ? [found] : [] };
      }

      // UPDATE service_records SET status = ...
      if (sql.includes('UPDATE service_records') && sql.includes('SET status = $2')) {
        const id = String(params[0]);
        const nextStatus = String(params[1]);
        const found = services.find((s) => s.id === id);
        if (found) {
          found.status = nextStatus;
          found.updated_at = new Date();
          return { rows: [found] };
        }
        return { rows: [] };
      }

      // UPDATE service_records SET status = 'PUBLISHED'
      if (sql.includes('UPDATE service_records') && sql.includes("SET status = 'PUBLISHED'")) {
        const id = String(params[0]);
        const currentVerId = (params[1] as string) ?? null;
        const found = services.find((s) => s.id === id);
        if (found) {
          found.status = 'PUBLISHED';
          found.current_version_id = currentVerId;
          found.updated_at = new Date();
          return { rows: [found] };
        }
        return { rows: [] };
      }

      // UPDATE service_records SET status = 'DEPRECATED'
      if (sql.includes('UPDATE service_records') && sql.includes("SET status = 'DEPRECATED'")) {
        const id = String(params[0]);
        const found = services.find((s) => s.id === id);
        if (found) {
          found.status = 'DEPRECATED';
          found.updated_at = new Date();
          return { rows: [found] };
        }
        return { rows: [] };
      }

      // Generic UPDATE service_records
      if (sql.includes('UPDATE service_records')) {
        const id = String(params[params.length - 1]);
        const found = services.find((s) => s.id === id);
        if (found) {
          // Dynamic fields
          let pIdx = 0;
          if (sql.includes('slug = $')) found.slug = String(params[pIdx++]);
          if (sql.includes('service_type = $')) found.service_type = String(params[pIdx++]);
          if (sql.includes('title = $')) found.title = String(params[pIdx++]);
          if (sql.includes('short_description = $'))
            found.short_description = String(params[pIdx++]);
          if (sql.includes('department_name = $')) found.department_name = String(params[pIdx++]);
          if (sql.includes('state_code = $')) found.state_code = (params[pIdx++] as string) ?? null;
          found.updated_at = new Date();
          return { rows: [found] };
        }
        return { rows: [] };
      }

      // SELECT COALESCE(MAX(version_number), 0) + 1 AS next_ver
      if (sql.includes('COALESCE(MAX(version_number), 0) + 1')) {
        const serviceId = String(params[0]);
        const svs = versions.filter((v) => v.service_id === serviceId);
        const maxVer = svs.reduce((max, v) => (v.version_number > max ? v.version_number : max), 0);
        return { rows: [{ next_ver: maxVer + 1 }] };
      }

      // INSERT INTO service_versions
      if (sql.includes('INSERT INTO service_versions')) {
        const id = crypto.randomUUID();
        const row: MockVersionRow = {
          id,
          service_id: String(params[0]),
          version_number: Number(params[1]),
          content: JSON.parse(String(params[2])),
          language: String(params[3]),
          effective_from: (params[4] as string) ?? null,
          effective_to: (params[5] as string) ?? null,
          created_by: String(params[6]),
          approved_by: null,
          created_at: new Date(),
        };
        versions.push(row);
        return { rows: [row] };
      }

      // SELECT id FROM service_versions WHERE service_id = $1 ORDER BY version_number DESC LIMIT 1
      if (
        sql.includes('FROM service_versions') &&
        sql.includes('ORDER BY version_number DESC LIMIT 1')
      ) {
        const serviceId = String(params[0]);
        const svs = versions.filter((v) => v.service_id === serviceId);
        svs.sort((a, b) => b.version_number - a.version_number);
        return { rows: svs[0] ? [svs[0]] : [] };
      }

      // UPDATE service_versions SET approved_by = $2 WHERE id = $1
      if (sql.includes('UPDATE service_versions') && sql.includes('SET approved_by')) {
        const id = String(params[0]);
        const approvedBy = String(params[1]);
        const found = versions.find((v) => v.id === id);
        if (found) {
          found.approved_by = approvedBy;
        }
        return { rows: [] };
      }

      // INSERT INTO service_sources
      if (sql.includes('INSERT INTO service_sources')) {
        const id = crypto.randomUUID();
        const now = new Date();
        const row: MockSourceRow = {
          id,
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

      // INSERT INTO content_reviews
      if (sql.includes('INSERT INTO content_reviews')) {
        const id = crypto.randomUUID();
        const row: MockReviewRow = {
          id,
          service_id: String(params[0]),
          reviewer_id: (params[1] as string) ?? null,
          decision: String(params[2]),
          notes: (params[3] as string) ?? null,
          reviewed_at: new Date(),
        };
        reviews.push(row);
        return { rows: [row] };
      }

      // INSERT INTO audit_logs
      if (sql.includes('INSERT INTO audit_logs')) {
        const id = crypto.randomUUID();
        const row: MockAuditRow = {
          id,
          actor_id: (params[0] as string) ?? null,
          action: String(params[1]),
          resource_type: String(params[2]),
          resource_id: (params[3] as string) ?? null,
          metadata: JSON.parse(String(params[4])),
          created_at: new Date(),
        };
        auditLogs.push(row);
        return { rows: [row] };
      }

      // SELECT FROM service_versions WHERE service_id = $1 ORDER BY version_number DESC
      if (sql.includes('FROM service_versions') && sql.includes('ORDER BY version_number DESC')) {
        const serviceId = String(params[0]);
        const svs = versions.filter((v) => v.service_id === serviceId);
        svs.sort((a, b) => b.version_number - a.version_number);
        return { rows: svs };
      }

      // SELECT FROM content_reviews WHERE service_id = $1 ORDER BY reviewed_at DESC
      if (sql.includes('FROM content_reviews') && sql.includes('ORDER BY reviewed_at DESC')) {
        const serviceId = String(params[0]);
        const rvs = reviews.filter((r) => r.service_id === serviceId);
        rvs.sort((a, b) => b.reviewed_at.getTime() - a.reviewed_at.getTime());
        return { rows: rvs };
      }

      // SELECT FROM audit_logs
      if (sql.includes('FROM audit_logs')) {
        let filtered = [...auditLogs];
        let p = 0;
        if (sql.includes('actor_id = $')) {
          const act = String(params[p++]);
          filtered = filtered.filter((a) => a.actor_id === act);
        }
        if (sql.includes('resource_type = $')) {
          const rt = String(params[p++]);
          filtered = filtered.filter((a) => a.resource_type === rt);
        }
        if (sql.includes('resource_id = $')) {
          const ri = String(params[p++]);
          filtered = filtered.filter((a) => a.resource_id === ri);
        }
        const limit = Number(params[p++]) || 20;
        const offset = Number(params[p++]) || 0;
        filtered.sort((a, b) => b.created_at.getTime() - a.created_at.getTime());
        return { rows: filtered.slice(offset, offset + limit) };
      }

      return { rows: [] };
    },
  };
}

describe('@janasahayak/api Admin Content Workflow', () => {
  const env = loadApiEnv({
    NODE_ENV: 'test',
    API_CORS_ORIGINS: 'http://localhost:3000',
  });

  test('enforces authentication and rejects unauthenticated requests with 401', async () => {
    const db = createInMemoryDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/services',
        payload: {
          slug: 'test-service',
          serviceType: 'SCHEME',
          title: 'Test Service',
          shortDescription: 'Valid short description for testing.',
          departmentName: 'Test Dept',
        },
      });

      assert.equal(res.statusCode, 401);
      const json = JSON.parse(res.body);
      assert.equal(json.error.code, 'UNAUTHORIZED');
    } finally {
      await app.close();
    }
  });

  test('enforces RBAC and rejects unauthorized roles with 403', async () => {
    const db = createInMemoryDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      // Content editor cannot review or publish services
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/services/11111111-1111-1111-1111-111111111111/publish',
        headers: {
          'x-admin-role': 'CONTENT_EDITOR',
          'x-admin-user-id': '00000000-0000-0000-0000-000000000001',
        },
      });

      assert.equal(res.statusCode, 403);
      const json = JSON.parse(res.body);
      assert.equal(json.error.code, 'FORBIDDEN');
    } finally {
      await app.close();
    }
  });

  test('completes end-to-end admin workflow: create draft -> version -> source -> submit review -> approve -> publish -> deprecate', async () => {
    const db = createInMemoryDatabase();
    const app = await buildApp({ env, db, logger: false });

    const editorHeaders = {
      'x-admin-role': 'CONTENT_EDITOR',
      'x-admin-user-id': '00000000-0000-0000-0000-000000000001',
    };

    const reviewerHeaders = {
      'x-admin-role': 'CONTENT_REVIEWER',
      'x-admin-user-id': '00000000-0000-0000-0000-000000000002',
    };

    const adminHeaders = {
      'x-admin-role': 'ADMIN',
      'x-admin-user-id': '00000000-0000-0000-0000-000000000003',
    };

    try {
      // 1. Create Service Draft
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/services',
        headers: editorHeaders,
        payload: {
          slug: 'synthetic-karnataka-ration-card',
          serviceType: 'CERTIFICATE',
          title: '[Synthetic Sample] Ration Card Assistance',
          shortDescription:
            'Guidance on eligibility and application steps for synthetic ration card services.',
          departmentName: 'Food, Civil Supplies & Consumer Affairs',
          stateCode: 'KA',
        },
      });

      assert.equal(createRes.statusCode, 201);
      const createBody = JSON.parse(createRes.body);
      const serviceId = createBody.data.id;
      assert.equal(createBody.data.status, 'DRAFT');
      assert.equal(createBody.data.slug, 'synthetic-karnataka-ration-card');

      // 2. Update Service Details
      const updateRes = await app.inject({
        method: 'PATCH',
        url: `/api/v1/admin/services/${serviceId}`,
        headers: editorHeaders,
        payload: {
          title: '[Synthetic Sample] Priority Ration Card Guidance',
        },
      });

      assert.equal(updateRes.statusCode, 200);
      const updateBody = JSON.parse(updateRes.body);
      assert.equal(updateBody.data.title, '[Synthetic Sample] Priority Ration Card Guidance');

      // 3. Add Content Version
      const versionRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/versions`,
        headers: editorHeaders,
        payload: {
          content: {
            summary: 'Comprehensive eligibility and step-by-step guidance for ration card seekers.',
            requirements: ['Domicile of Karnataka', 'Income threshold below state ceiling'],
          },
          language: 'en',
          effectiveFrom: '2026-04-01',
        },
      });

      assert.equal(versionRes.statusCode, 201);
      const versionBody = JSON.parse(versionRes.body);
      assert.equal(versionBody.data.versionNumber, 1);
      const versionId = versionBody.data.id;

      // 4. Add Official Source Metadata
      const sourceRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/sources`,
        headers: editorHeaders,
        payload: {
          sourceUrl: 'https://ahara.kar.nic.in/status_service',
          sourceType: 'OFFICIAL_PORTAL',
          publisher: 'Department of Food and Civil Supplies',
          verificationStatus: 'VERIFIED',
          reviewNotes: 'Verified via official food department portal guidance notice.',
        },
      });

      assert.equal(sourceRes.statusCode, 201);
      const sourceBody = JSON.parse(sourceRes.body);
      assert.equal(sourceBody.data.sourceUrl, 'https://ahara.kar.nic.in/status_service');

      // 5. Attempting to publish before review must fail (must be VERIFIED)
      const prematurePublishRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/publish`,
        headers: reviewerHeaders,
      });
      assert.equal(prematurePublishRes.statusCode, 409);

      // 6. Submit Draft for Review
      const submitRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/submit-review`,
        headers: editorHeaders,
        payload: {
          notes: 'Initial synthetic content and official sources verified.',
        },
      });

      assert.equal(submitRes.statusCode, 200);
      const submitBody = JSON.parse(submitRes.body);
      assert.equal(submitBody.data.status, 'IN_REVIEW');

      // 7. Review Decision: APPROVED -> transitions to VERIFIED
      const reviewRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/review`,
        headers: reviewerHeaders,
        payload: {
          decision: 'APPROVED',
          notes: 'Source verified against ahara.kar.nic.in. Guidelines verified accurate.',
        },
      });

      assert.equal(reviewRes.statusCode, 200);
      const reviewBody = JSON.parse(reviewRes.body);
      assert.equal(reviewBody.data.service.status, 'VERIFIED');
      assert.equal(reviewBody.data.review.decision, 'APPROVED');

      // 8. Publish Service
      const publishRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/publish`,
        headers: reviewerHeaders,
        payload: {
          versionId,
        },
      });

      assert.equal(publishRes.statusCode, 200);
      const publishBody = JSON.parse(publishRes.body);
      assert.equal(publishBody.data.status, 'PUBLISHED');
      assert.equal(publishBody.data.currentVersionId, versionId);

      // 9. Inspect Service Version & Review History
      const historyRes = await app.inject({
        method: 'GET',
        url: `/api/v1/admin/services/${serviceId}/history`,
        headers: editorHeaders,
      });

      assert.equal(historyRes.statusCode, 200);
      const historyBody = JSON.parse(historyRes.body);
      assert.equal(historyBody.data.versions.length, 1);
      assert.equal(historyBody.data.reviews.length, 1);
      assert.equal(historyBody.data.reviews[0].decision, 'APPROVED');

      // 10. Deprecate Service
      const deprecateRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/deprecate`,
        headers: reviewerHeaders,
      });

      assert.equal(deprecateRes.statusCode, 200);
      const deprecateBody = JSON.parse(deprecateRes.body);
      assert.equal(deprecateBody.data.status, 'DEPRECATED');

      // 11. Query Immutable Audit Logs (as ADMIN)
      const auditRes = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/audit-logs',
        headers: adminHeaders,
      });

      assert.equal(auditRes.statusCode, 200);
      const auditBody = JSON.parse(auditRes.body);
      assert.ok(Array.isArray(auditBody.data));
      // Should have recorded all steps
      const actions = auditBody.data.map((l: { action: string }) => l.action);
      assert.ok(actions.includes('SERVICE_CREATE'));
      assert.ok(actions.includes('SERVICE_UPDATE'));
      assert.ok(actions.includes('SERVICE_VERSION_CREATE'));
      assert.ok(actions.includes('SERVICE_SOURCE_ADD'));
      assert.ok(actions.includes('SERVICE_SUBMIT_REVIEW'));
      assert.ok(actions.includes('SERVICE_REVIEW_DECISION'));
      assert.ok(actions.includes('SERVICE_PUBLISH'));
      assert.ok(actions.includes('SERVICE_DEPRECATE'));
    } finally {
      await app.close();
    }
  });

  test('handles review rejection and changes requested transitions', async () => {
    const db = createInMemoryDatabase();
    const app = await buildApp({ env, db, logger: false });

    const editorHeaders = {
      'x-admin-role': 'CONTENT_EDITOR',
      'x-admin-user-id': '00000000-0000-0000-0000-000000000001',
    };

    const reviewerHeaders = {
      'x-admin-role': 'CONTENT_REVIEWER',
      'x-admin-user-id': '00000000-0000-0000-0000-000000000002',
    };

    try {
      // Create draft
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/admin/services',
        headers: editorHeaders,
        payload: {
          slug: 'synthetic-pension-guidance',
          serviceType: 'WELFARE',
          title: '[Synthetic Sample] Old Age Pension Scheme',
          shortDescription: 'Guidance for old age pension scheme applications.',
          departmentName: 'Revenue Department',
        },
      });
      const serviceId = JSON.parse(createRes.body).data.id;

      // Submit for review
      await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/submit-review`,
        headers: editorHeaders,
      });

      // Reviewer requests changes -> status becomes DRAFT
      const changesRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/review`,
        headers: reviewerHeaders,
        payload: {
          decision: 'CHANGES_REQUESTED',
          notes: 'Please add supporting government orders.',
        },
      });
      assert.equal(changesRes.statusCode, 200);
      assert.equal(JSON.parse(changesRes.body).data.service.status, 'DRAFT');

      // Submit again
      await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/submit-review`,
        headers: editorHeaders,
      });

      // Reviewer rejects -> status becomes REJECTED
      const rejectRes = await app.inject({
        method: 'POST',
        url: `/api/v1/admin/services/${serviceId}/review`,
        headers: reviewerHeaders,
        payload: {
          decision: 'REJECTED',
          notes: 'Information could not be verified from official gazette.',
        },
      });
      assert.equal(rejectRes.statusCode, 200);
      assert.equal(JSON.parse(rejectRes.body).data.service.status, 'REJECTED');
    } finally {
      await app.close();
    }
  });

  test('validates Bearer token authentication header', async () => {
    const db = createInMemoryDatabase();
    const app = await buildApp({ env, db, logger: false });

    try {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/admin/audit-logs',
        headers: {
          authorization: 'Bearer mock-admin-token',
        },
      });

      assert.equal(res.statusCode, 200);
      const json = JSON.parse(res.body);
      assert.ok(Array.isArray(json.data));
    } finally {
      await app.close();
    }
  });
});
