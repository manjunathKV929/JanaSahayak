import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type { Queryable } from './client.js';
import {
  addServiceSource,
  createServiceDraft,
  createServiceVersion,
  deprecateService,
  getServiceById,
  getServiceHistory,
  publishService,
  queryAuditLogs,
  transitionServiceStatus,
  updateService,
} from './schema/admin.js';

describe('@janasahayak/db Admin Content Repository', () => {
  test('creates a draft service record with DRAFT status', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /INSERT INTO service_records/);
        assert.deepEqual(params, [
          'synthetic-test-service',
          'SCHEME',
          'Test Service',
          'A test description for the service.',
          'Test Department',
          'KA',
        ]);
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-test-service',
              service_type: 'SCHEME',
              title: 'Test Service',
              short_description: 'A test description for the service.',
              department_name: 'Test Department',
              state_code: 'KA',
              status: 'DRAFT',
              current_version_id: null,
              created_at: new Date('2026-11-19T10:00:00Z'),
              updated_at: new Date('2026-11-19T10:00:00Z'),
            },
          ],
        };
      },
    };

    const service = await createServiceDraft(mockClient, {
      slug: 'synthetic-test-service',
      serviceType: 'SCHEME',
      title: 'Test Service',
      shortDescription: 'A test description for the service.',
      departmentName: 'Test Department',
      stateCode: 'KA',
    });

    assert.equal(service.id, '11111111-1111-1111-1111-111111111111');
    assert.equal(service.status, 'DRAFT');
    assert.equal(service.title, 'Test Service');
  });

  test('retrieves service by id', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /FROM service_records\s+WHERE id = \$1/);
        assert.deepEqual(params, ['11111111-1111-1111-1111-111111111111']);
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-test-service',
              service_type: 'SCHEME',
              title: 'Test Service',
              short_description: 'A test description for the service.',
              department_name: 'Test Department',
              state_code: 'KA',
              status: 'DRAFT',
              current_version_id: null,
              created_at: new Date('2026-11-19T10:00:00Z'),
              updated_at: new Date('2026-11-19T10:00:00Z'),
            },
          ],
        };
      },
    };

    const service = await getServiceById(mockClient, '11111111-1111-1111-1111-111111111111');
    assert.ok(service);
    assert.equal(service.id, '11111111-1111-1111-1111-111111111111');
  });

  test('updates service record fields with updated_at', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /UPDATE service_records/);
        assert.match(String(sql), /title = \$1/);
        assert.match(String(sql), /updated_at = NOW\(\)/);
        assert.deepEqual(params, ['Updated Title', '11111111-1111-1111-1111-111111111111']);
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-test-service',
              service_type: 'SCHEME',
              title: 'Updated Title',
              short_description: 'A test description for the service.',
              department_name: 'Test Department',
              state_code: 'KA',
              status: 'DRAFT',
              current_version_id: null,
              created_at: new Date('2026-11-19T10:00:00Z'),
              updated_at: new Date('2026-11-19T11:00:00Z'),
            },
          ],
        };
      },
    };

    const updated = await updateService(mockClient, '11111111-1111-1111-1111-111111111111', {
      title: 'Updated Title',
    });

    assert.ok(updated);
    assert.equal(updated.title, 'Updated Title');
  });

  test('creates new service version with auto-incremented version number', async () => {
    let callCount = 0;
    const mockClient: Queryable = {
      query: async (sql) => {
        callCount++;
        if (callCount === 1) {
          assert.match(String(sql), /SELECT COALESCE\(MAX\(version_number\)/);
          return { rows: [{ next_ver: 2 }] };
        }
        assert.match(String(sql), /INSERT INTO service_versions/);
        return {
          rows: [
            {
              id: '22222222-2222-2222-2222-222222222222',
              service_id: '11111111-1111-1111-1111-111111111111',
              version_number: 2,
              content: { overview: 'New version content' },
              language: 'en',
              effective_from: '2026-04-01',
              effective_to: null,
              created_by: '33333333-3333-3333-3333-333333333333',
              approved_by: null,
              created_at: new Date('2026-11-19T12:00:00Z'),
            },
          ],
        };
      },
    };

    const version = await createServiceVersion(
      mockClient,
      '11111111-1111-1111-1111-111111111111',
      {
        content: { overview: 'New version content' },
        language: 'en',
        effectiveFrom: '2026-04-01',
      },
      '33333333-3333-3333-3333-333333333333',
    );

    assert.equal(version.versionNumber, 2);
    assert.equal(version.createdBy, '33333333-3333-3333-3333-333333333333');
  });

  test('adds official source metadata to a service', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /INSERT INTO service_sources/);
        assert.deepEqual(params, [
          '11111111-1111-1111-1111-111111111111',
          'https://nadakacheri.karnataka.gov.in',
          'OFFICIAL_PORTAL',
          'Directorate of Electronic Delivery of Citizen Services',
          'VERIFIED',
          'Verified via official portal test',
        ]);
        return {
          rows: [
            {
              id: '44444444-4444-4444-4444-444444444444',
              service_id: '11111111-1111-1111-1111-111111111111',
              source_url: 'https://nadakacheri.karnataka.gov.in',
              source_type: 'OFFICIAL_PORTAL',
              publisher: 'Directorate of Electronic Delivery of Citizen Services',
              retrieved_at: new Date('2026-11-19T10:00:00Z'),
              last_verified_at: new Date('2026-11-19T10:00:00Z'),
              verification_status: 'VERIFIED',
              review_notes: 'Verified via official portal test',
            },
          ],
        };
      },
    };

    const source = await addServiceSource(mockClient, '11111111-1111-1111-1111-111111111111', {
      sourceUrl: 'https://nadakacheri.karnataka.gov.in',
      sourceType: 'OFFICIAL_PORTAL',
      publisher: 'Directorate of Electronic Delivery of Citizen Services',
      verificationStatus: 'VERIFIED',
      reviewNotes: 'Verified via official portal test',
    });

    assert.equal(source.verificationStatus, 'VERIFIED');
    assert.equal(source.sourceUrl, 'https://nadakacheri.karnataka.gov.in');
  });

  test('transitions service status and deprecates service', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        if (params?.[1] === 'IN_REVIEW') {
          return {
            rows: [
              {
                id: '11111111-1111-1111-1111-111111111111',
                slug: 'synthetic-test-service',
                service_type: 'SCHEME',
                title: 'Test Service',
                short_description: 'Description',
                department_name: 'Department',
                state_code: null,
                status: 'IN_REVIEW',
                current_version_id: null,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          };
        }
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-test-service',
              service_type: 'SCHEME',
              title: 'Test Service',
              short_description: 'Description',
              department_name: 'Department',
              state_code: null,
              status: 'DEPRECATED',
              current_version_id: null,
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };
      },
    };

    const inReview = await transitionServiceStatus(
      mockClient,
      '11111111-1111-1111-1111-111111111111',
      'IN_REVIEW',
    );
    assert.equal(inReview?.status, 'IN_REVIEW');

    const deprecated = await deprecateService(mockClient, '11111111-1111-1111-1111-111111111111');
    assert.equal(deprecated?.status, 'DEPRECATED');
  });

  test('publishes service with current_version_id update and approved_by', async () => {
    let callStep = 0;
    const mockClient: Queryable = {
      query: async (sql) => {
        callStep++;
        if (callStep === 1) {
          assert.match(String(sql), /UPDATE service_versions\s+SET approved_by/);
          return { rows: [] };
        }
        assert.match(String(sql), /UPDATE service_records\s+SET status = 'PUBLISHED'/);
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-test-service',
              service_type: 'SCHEME',
              title: 'Test Service',
              short_description: 'Description',
              department_name: 'Department',
              state_code: null,
              status: 'PUBLISHED',
              current_version_id: '22222222-2222-2222-2222-222222222222',
              created_at: new Date(),
              updated_at: new Date(),
            },
          ],
        };
      },
    };

    const published = await publishService(
      mockClient,
      '11111111-1111-1111-1111-111111111111',
      'reviewer-user-id',
      '22222222-2222-2222-2222-222222222222',
    );

    assert.equal(published?.status, 'PUBLISHED');
    assert.equal(published?.currentVersionId, '22222222-2222-2222-2222-222222222222');
  });

  test('retrieves version and review history', async () => {
    let step = 0;
    const mockClient: Queryable = {
      query: async () => {
        step++;
        if (step === 1) {
          return {
            rows: [
              {
                id: 'v1',
                service_id: 's1',
                version_number: 1,
                content: { text: 'v1' },
                language: 'en',
                effective_from: null,
                effective_to: null,
                created_by: 'u1',
                approved_by: 'u2',
                created_at: new Date(),
              },
            ],
          };
        }
        return {
          rows: [
            {
              id: 'r1',
              service_id: 's1',
              reviewer_id: 'u2',
              decision: 'APPROVED',
              notes: 'LGTM',
              reviewed_at: new Date(),
            },
          ],
        };
      },
    };

    const history = await getServiceHistory(mockClient, 's1');
    assert.equal(history.versions.length, 1);
    assert.equal(history.reviews.length, 1);
    assert.equal(history.reviews[0]?.decision, 'APPROVED');
  });

  test('queries audit logs with filtering and pagination', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /FROM audit_logs/);
        assert.match(String(sql), /actor_id = \$1/);
        assert.deepEqual(params, ['u1', 10, 0]);
        return {
          rows: [
            {
              id: 'log1',
              actor_id: 'u1',
              action: 'SERVICE_CREATE',
              resource_type: 'service',
              resource_id: 's1',
              metadata: { title: 'Created' },
              created_at: new Date(),
            },
          ],
        };
      },
    };

    const logs = await queryAuditLogs(mockClient, { actorId: 'u1', limit: 10, offset: 0 });
    assert.equal(logs.length, 1);
    assert.equal(logs[0]?.action, 'SERVICE_CREATE');
  });
});
