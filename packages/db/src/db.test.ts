import assert from 'node:assert/strict';
import { describe, it, mock } from 'node:test';
import { buildPoolConfig, checkDatabaseHealth, type Queryable } from './client.js';
import {
  getDefaultMigrationsDir,
  loadMigrationFiles,
  runMigrations,
  type MigrationClient,
} from './migrator.js';
import {
  findAuditLogsByResource,
  findDocumentById,
  findServiceBySlug,
  getDocumentsForService,
  getEligibilityForService,
  getJourneyWithSteps,
  getReviewsForService,
  getServiceDetail,
  listPublishedServices,
  recordAuditLog,
  recordContentReview,
} from './schema/index.js';

describe('@janasahayak/db Client & Migrator', () => {
  it('enables strict TLS certificate validation when SSL is enabled', () => {
    const sslConfig = buildPoolConfig({
      connectionString: 'postgresql://user:pass@db.example.org:5432/janasahayak',
      ssl: true,
      maxConnections: 15,
    });
    assert.deepEqual(sslConfig.ssl, { rejectUnauthorized: true });
    assert.equal(sslConfig.max, 15);

    const localConfig = buildPoolConfig({
      connectionString: 'postgresql://user:pass@127.0.0.1:5432/janasahayak',
      ssl: false,
    });
    assert.equal(localConfig.ssl, false);
  });

  it('reports healthy and unhealthy database responses safely', async () => {
    const healthy = await checkDatabaseHealth({
      query: async () => ({ rows: [{ ok: 1 }] }),
    });
    assert.equal(healthy, true);

    const unhealthy = await checkDatabaseHealth({
      query: async () => {
        throw new Error('connection refused');
      },
    });
    assert.equal(unhealthy, false);
  });

  it('loads all core migration files in sorted order with sha256 checksums', async () => {
    const files = await loadMigrationFiles(getDefaultMigrationsDir());
    assert.equal(files.length, 6);
    assert.equal(files[0]?.name, '0000_bootstrap.sql');
    assert.equal(files[1]?.name, '0001_core_content_model.sql');
    assert.equal(files[2]?.name, '0002_seed_synthetic_sample.sql');
    assert.equal(files[3]?.name, '0003_document_guides.sql');
    assert.equal(files[4]?.name, '0004_journey_engine.sql');
    assert.equal(files[5]?.name, '0005_localized_content.sql');

    for (const file of files) {
      assert.match(file.checksum, /^[a-f0-9]{64}$/);
      assert.ok(file.sql.length > 0);
    }
  });

  it('detects migration checksum tampering and throws error', async () => {
    const files = await loadMigrationFiles(getDefaultMigrationsDir());
    const tamperedName = files[0]?.name ?? '0000_bootstrap.sql';

    const client: MigrationClient = {
      query: async (sql: string) => {
        if (sql.includes('SELECT name, checksum FROM schema_migrations')) {
          return {
            rows: [{ name: tamperedName, checksum: 'bad-tampered-checksum-00000000000000000000' }],
          };
        }
        return { rows: [] };
      },
      release: mock.fn(),
    };

    await assert.rejects(
      async () => runMigrations({ connect: async () => client }, getDefaultMigrationsDir()),
      /Migration checksum mismatch/,
    );
  });

  it('applies unapplied migrations transactionally', async () => {
    const files = await loadMigrationFiles(getDefaultMigrationsDir());
    const executedSql: string[] = [];
    const release = mock.fn();

    const client: MigrationClient = {
      query: async (sql: string) => {
        executedSql.push(sql.trim());
        if (sql.includes('SELECT name, checksum FROM schema_migrations')) {
          return { rows: [] };
        }
        return { rows: [] };
      },
      release,
    };

    const result = await runMigrations({ connect: async () => client }, getDefaultMigrationsDir());
    assert.deepEqual(
      result.applied,
      files.map((f) => f.name),
    );
    assert.deepEqual(result.skipped, []);
    assert.ok(executedSql.includes('BEGIN'));
    assert.ok(executedSql.includes('COMMIT'));
    assert.equal(release.mock.callCount(), 1);
  });
});

describe('@janasahayak/db Content Model Repositories', () => {
  const fakeDate = new Date('2026-11-18T12:00:00.000Z');

  it('finds service by slug with typed mapping', async () => {
    const mockClient: Queryable = {
      query: async (_sql, values) => {
        if (values?.[0] === 'synthetic-post-matric-scholarship') {
          return {
            rows: [
              {
                id: 'e0000000-0000-0000-0000-000000000001',
                slug: 'synthetic-post-matric-scholarship',
                service_type: 'SCHOLARSHIP',
                title: '[Synthetic Sample] Post-Matric Scholarship',
                short_description: 'Financial assistance for post-matric students.',
                department_name: 'Department of Social Welfare',
                state_code: 'KA',
                status: 'PUBLISHED',
                current_version_id: 'e0000000-0000-0000-0001-000000000001',
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const service = await findServiceBySlug(mockClient, 'synthetic-post-matric-scholarship');
    assert.ok(service);
    assert.equal(service.slug, 'synthetic-post-matric-scholarship');
    assert.equal(service.serviceType, 'SCHOLARSHIP');
    assert.equal(service.status, 'PUBLISHED');
    assert.equal(service.stateCode, 'KA');

    const notFound = await findServiceBySlug(mockClient, 'non-existent-slug');
    assert.equal(notFound, null);
  });

  it('lists published services with optional state filter', async () => {
    const mockClient: Queryable = {
      query: async (sql, values) => {
        assert.ok(sql.includes("status = 'PUBLISHED'"));
        if (values?.[1] === 'KA') {
          return {
            rows: [
              {
                id: 'e1',
                slug: 'service-1',
                service_type: 'SCHOLARSHIP',
                title: 'Service 1',
                short_description: 'Summary 1',
                department_name: 'Dept 1',
                state_code: 'KA',
                status: 'PUBLISHED',
                current_version_id: null,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const list = await listPublishedServices(mockClient, { stateCode: 'KA', limit: 10 });
    assert.equal(list.length, 1);
    assert.equal(list[0]?.slug, 'service-1');
  });

  it('retrieves detailed service bundle (service, version, sources, documents, rules, journey)', async () => {
    const mockClient: Queryable = {
      query: async (sql) => {
        if (sql.includes('FROM service_records')) {
          return {
            rows: [
              {
                id: 's1',
                slug: 'service-1',
                service_type: 'SCHOLARSHIP',
                title: 'Post-Matric Scholarship',
                short_description: 'Summary',
                department_name: 'Social Welfare',
                state_code: 'KA',
                status: 'PUBLISHED',
                current_version_id: 'v1',
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (sql.includes('FROM service_versions')) {
          return {
            rows: [
              {
                id: 'v1',
                service_id: 's1',
                version_number: 1,
                content: { benefit: 'Tuition' },
                language: 'en',
                effective_from: '2026-06-01',
                effective_to: null,
                created_by: 'u1',
                approved_by: 'u1',
                created_at: fakeDate,
              },
            ],
          };
        }
        if (sql.includes('FROM service_sources')) {
          return {
            rows: [
              {
                id: 'src1',
                service_id: 's1',
                source_url: 'https://sevasindhu.karnataka.gov.in',
                source_type: 'OFFICIAL_PORTAL',
                publisher: 'Karnataka Gov',
                retrieved_at: fakeDate,
                last_verified_at: fakeDate,
                verification_status: 'VERIFIED',
                review_notes: 'Verified source',
              },
            ],
          };
        }
        if (sql.includes('FROM service_documents')) {
          return {
            rows: [
              {
                id: 'doc1',
                name: 'Income Certificate',
                description: 'Valid certificate',
                document_type: 'CERTIFICATE',
                issuer_id: 'i1',
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (sql.includes('FROM eligibility_rules')) {
          return {
            rows: [
              {
                id: 'r1',
                service_id: 's1',
                name: 'Rule 1',
                rule_expression: { all: [{ field: 'state', operator: '==', value: 'KA' }] },
                explanation: { en: 'Must be from KA' },
                priority: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (sql.includes('FROM journeys')) {
          return {
            rows: [
              {
                id: 'j1',
                service_id: 's1',
                title: 'Application Journey',
                description: 'Steps',
                version: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const bundle = await getServiceDetail(mockClient, 's1');
    assert.ok(bundle);
    assert.equal(bundle.service.title, 'Post-Matric Scholarship');
    assert.equal(bundle.version?.versionNumber, 1);
    assert.equal(bundle.sources[0]?.verificationStatus, 'VERIFIED');
    assert.equal(bundle.documents[0]?.name, 'Income Certificate');
    assert.equal(bundle.rules[0]?.name, 'Rule 1');
    assert.equal(bundle.journey?.title, 'Application Journey');
  });

  it('retrieves document with issuer authority information', async () => {
    const mockClient: Queryable = {
      query: async () => ({
        rows: [
          {
            id: 'd1',
            name: 'Income Certificate',
            description: 'Annual income proof',
            document_type: 'CERTIFICATE',
            issuer_id: 'i1',
            created_at: fakeDate,
            updated_at: fakeDate,
            issuer_pk: 'i1',
            issuer_name: 'Nadakacheri',
            issuer_category: 'STATE_DEPARTMENT',
            portal_url: 'https://nadakacheri.karnataka.gov.in',
            issuer_created_at: fakeDate,
          },
        ],
      }),
    };

    const docBundle = await findDocumentById(mockClient, 'd1');
    assert.ok(docBundle);
    assert.equal(docBundle.document.name, 'Income Certificate');
    assert.equal(docBundle.issuer?.name, 'Nadakacheri');
    assert.equal(docBundle.issuer?.portalUrl, 'https://nadakacheri.karnataka.gov.in');

    const serviceDocs = await getDocumentsForService(mockClient, 's1');
    assert.equal(serviceDocs.length, 1);
    assert.equal(serviceDocs[0]?.name, 'Income Certificate');
  });

  it('retrieves eligibility questions, options, and deterministic rules', async () => {
    const mockClient: Queryable = {
      query: async (sql) => {
        if (sql.includes('FROM eligibility_questions')) {
          return {
            rows: [
              {
                id: 'q1',
                service_id: 's1',
                key: 'stateDomicile',
                question_text: { en: 'Are you from KA?' },
                answer_type: 'boolean',
                required: true,
                display_order: 1,
              },
            ],
          };
        }
        if (sql.includes('FROM eligibility_options')) {
          return { rows: [] };
        }
        if (sql.includes('FROM eligibility_rules')) {
          return {
            rows: [
              {
                id: 'r1',
                service_id: 's1',
                name: 'Domicile Rule',
                rule_expression: { all: [{ field: 'stateDomicile', operator: '==', value: true }] },
                explanation: { en: 'Resident required' },
                priority: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const bundle = await getEligibilityForService(mockClient, 's1');
    assert.equal(bundle.questions.length, 1);
    assert.equal(bundle.questions[0]?.key, 'stateDomicile');
    assert.equal(bundle.rules.length, 1);
    assert.equal(bundle.rules[0]?.priority, 1);
  });

  it('retrieves journey with ordered action steps', async () => {
    const mockClient: Queryable = {
      query: async (sql) => {
        if (sql.includes('FROM journeys')) {
          return {
            rows: [
              {
                id: 'j1',
                service_id: 's1',
                title: 'Scholarship Journey',
                description: 'Follow these steps',
                version: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (sql.includes('FROM journey_steps')) {
          return {
            rows: [
              {
                id: 'step1',
                journey_id: 'j1',
                step_key: 'verify_docs',
                title: 'Check Documents',
                description: { en: 'Have income certificate' },
                step_type: 'DOCUMENT_CHECK',
                display_order: 1,
                official_url: null,
                completion_rule: null,
              },
              {
                id: 'step2',
                journey_id: 'j1',
                step_key: 'apply_portal',
                title: 'Apply on Portal',
                description: { en: 'Open official portal' },
                step_type: 'OFFICIAL_ACTION',
                display_order: 2,
                official_url: 'https://sevasindhu.karnataka.gov.in',
                completion_rule: null,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const bundle = await getJourneyWithSteps(mockClient, 's1');
    assert.ok(bundle);
    assert.equal(bundle.journey.title, 'Scholarship Journey');
    assert.equal(bundle.steps.length, 2);
    assert.equal(bundle.steps[1]?.stepKey, 'apply_portal');
    assert.equal(bundle.steps[1]?.officialUrl, 'https://sevasindhu.karnataka.gov.in');
  });

  it('records audit log with sensitive fields automatically redacted before SQL query', async () => {
    let capturedValues: unknown[] = [];
    const mockClient: Queryable = {
      query: async (sql, values) => {
        capturedValues = values ?? [];
        if (String(sql).includes('INSERT INTO audit_logs')) {
          return {
            rows: [
              {
                id: 'al1',
                actor_id: values?.[0],
                action: values?.[1],
                resource_type: values?.[2],
                resource_id: values?.[3],
                metadata: values?.[4] ? JSON.parse(String(values[4])) : {},
                created_at: fakeDate,
              },
            ],
          };
        }
        return {
          rows: [
            {
              id: 'al1',
              actor_id: 'u1',
              action: 'UPDATE_SERVICE',
              resource_type: values?.[0],
              resource_id: values?.[1],
              metadata: { adminNote: 'Reviewed verification' },
              created_at: fakeDate,
            },
          ],
        };
      },
    };

    const audit = await recordAuditLog(mockClient, {
      actorId: 'u1',
      action: 'UPDATE_SERVICE',
      resourceType: 'service_records',
      resourceId: 's1',
      metadata: {
        adminNote: 'Reviewed verification',
        password: 'should-never-be-stored',
        otp: '123456',
        citizenAadhaar: '1234 5678 9012',
      },
    });

    assert.equal(audit.action, 'UPDATE_SERVICE');
    // Ensure metadata was redacted before sending to DB query
    const sentMetadataString = String(capturedValues[4]);
    assert.ok(!sentMetadataString.includes('should-never-be-stored'));
    assert.ok(!sentMetadataString.includes('123456'));
    assert.ok(!sentMetadataString.includes('1234 5678 9012'));
    assert.equal(audit.metadata.password, '[REDACTED]');
    assert.equal(audit.metadata.otp, '[REDACTED]');

    const resourceLogs = await findAuditLogsByResource(mockClient, 'service_records', 's1');
    assert.equal(resourceLogs.length, 1);
    assert.equal(resourceLogs[0]?.action, 'UPDATE_SERVICE');
  });

  it('records and queries content review decisions', async () => {
    const mockClient: Queryable = {
      query: async (sql, values) => {
        if (sql.includes('INSERT INTO content_reviews')) {
          return {
            rows: [
              {
                id: 'cr1',
                service_id: values?.[0],
                reviewer_id: values?.[1],
                decision: values?.[2],
                notes: values?.[3],
                reviewed_at: fakeDate,
              },
            ],
          };
        }
        if (sql.includes('FROM content_reviews')) {
          return {
            rows: [
              {
                id: 'cr1',
                service_id: 's1',
                reviewer_id: 'u1',
                decision: 'APPROVED',
                notes: 'All checks passed',
                reviewed_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const review = await recordContentReview(mockClient, {
      serviceId: 's1',
      reviewerId: 'u1',
      decision: 'APPROVED',
      notes: 'All checks passed',
    });
    assert.equal(review.decision, 'APPROVED');

    const reviews = await getReviewsForService(mockClient, 's1');
    assert.equal(reviews.length, 1);
    assert.equal(reviews[0]?.decision, 'APPROVED');
  });
});
