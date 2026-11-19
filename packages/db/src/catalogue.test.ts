import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import type { Queryable } from './client.js';
import {
  getCatalogueCategories,
  getPublicServiceSources,
  getPublishedServiceBySlug,
  searchPublishedServices,
} from './schema/catalogue.js';

describe('@janasahayak/db Public Catalogue Repository', () => {
  test('searches published services with query, category, and state filters', async () => {
    let call = 0;
    const mockClient: Queryable = {
      query: async (sql, params) => {
        call++;
        if (call === 1) {
          assert.match(String(sql), /SELECT COUNT\(\*\)/);
          assert.match(String(sql), /sr\.status = 'PUBLISHED'/);
          assert.match(String(sql), /sr\.title ILIKE/);
          assert.deepEqual(params, ['%scholarship%', 'SCHEME', 'KA']);
          return { rows: [{ total: 1 }] };
        }
        assert.match(String(sql), /FROM service_records sr/);
        assert.match(String(sql), /LEFT JOIN LATERAL/);
        assert.deepEqual(params, ['%scholarship%', 'SCHEME', 'KA', 10, 0]);
        return {
          rows: [
            {
              id: '11111111-1111-1111-1111-111111111111',
              slug: 'synthetic-post-matric-scholarship',
              service_type: 'SCHEME',
              title: '[Synthetic Sample] Post-Matric Scholarship',
              short_description: 'Financial assistance for post-matriculation studies.',
              department_name: 'Social Welfare Department',
              state_code: 'KA',
              verification_status: 'VERIFIED',
              last_verified_at: new Date('2026-11-17T00:00:00Z'),
              updated_at: new Date('2026-11-17T00:00:00Z'),
            },
          ],
        };
      },
    };

    const result = await searchPublishedServices(mockClient, {
      q: 'scholarship',
      category: 'SCHEME',
      state: 'KA',
      limit: 10,
      offset: 0,
    });

    assert.equal(result.total, 1);
    assert.equal(result.services.length, 1);
    assert.equal(result.hasMore, false);
    assert.equal(result.services[0]?.slug, 'synthetic-post-matric-scholarship');
    assert.equal(result.services[0]?.verification.status, 'VERIFIED');
  });

  test('retrieves published service detail by slug without private notes', async () => {
    let callStep = 0;
    const mockClient: Queryable = {
      query: async (_sql) => {
        callStep++;
        if (callStep === 1) {
          // service_records
          return {
            rows: [
              {
                id: 's1',
                slug: 'synthetic-post-matric-scholarship',
                service_type: 'SCHEME',
                title: '[Synthetic Sample] Post-Matric Scholarship',
                short_description: 'Description',
                department_name: 'Social Welfare',
                state_code: 'KA',
                status: 'PUBLISHED',
                current_version_id: 'v1',
                created_at: new Date('2026-11-10T00:00:00Z'),
                updated_at: new Date('2026-11-17T00:00:00Z'),
              },
            ],
          };
        }
        if (callStep === 2) {
          // service_versions
          return {
            rows: [
              {
                id: 'v1',
                service_id: 's1',
                version_number: 1,
                content: { summary: 'Official guidance' },
                language: 'en',
                effective_from: '2026-04-01',
                effective_to: null,
                created_by: 'u1',
                approved_by: 'u2',
                created_at: new Date('2026-11-15T00:00:00Z'),
              },
            ],
          };
        }
        if (callStep === 3) {
          // sources
          return {
            rows: [
              {
                id: 'src1',
                service_id: 's1',
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
        if (callStep === 4) {
          // documents
          return {
            rows: [
              {
                id: 'doc1',
                name: 'Income Certificate',
                description: 'Valid income certificate issued by Tahsildar',
                document_type: 'CERTIFICATE',
                issuer_id: 'iss1',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          };
        }
        if (callStep === 5) {
          // rules
          return {
            rows: [
              {
                id: 'r1',
                service_id: 's1',
                name: 'Domicile Requirement',
                rule_expression: { field: 'state', operator: '==', value: 'KA' },
                explanation: { en: 'Must be a Karnataka resident' },
                priority: 1,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          };
        }
        if (callStep === 6) {
          // journey
          return {
            rows: [
              {
                id: 'j1',
                service_id: 's1',
                title: 'Application Journey',
                description: '3 simple steps',
                version: 1,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          };
        }
        if (callStep === 7) {
          // journey_steps
          return {
            rows: [
              {
                id: 'step1',
                journey_id: 'j1',
                step_key: 'prepare-docs',
                title: 'Gather Documents',
                description: { en: 'Prepare income and caste certificate' },
                step_type: 'DOCUMENT_CHECK',
                display_order: 1,
                official_url: null,
                completion_rule: null,
              },
            ],
          };
        }
        if (callStep === 8) {
          // deadlines
          return {
            rows: [
              {
                id: 'dl1',
                service_id: 's1',
                name: 'Application Window 2026-27',
                opens_at: new Date('2026-06-01T00:00:00Z'),
                closes_at: new Date('2026-10-31T23:59:59Z'),
                source_id: 'src1',
                status: 'OPEN',
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const detail = await getPublishedServiceBySlug(mockClient, 'synthetic-post-matric-scholarship');
    assert.ok(detail);
    assert.equal(detail.service.title, '[Synthetic Sample] Post-Matric Scholarship');
    assert.equal(detail.version?.versionNumber, 1);
    assert.equal(detail.sources.length, 1);
    assert.equal(detail.sources[0]?.sourceUrl, 'https://ssp.postmatric.karnataka.gov.in');
    assert.equal('reviewNotes' in (detail.sources[0] ?? {}), false);
    assert.equal(detail.documents.length, 1);
    assert.equal(detail.rules.length, 1);
    assert.equal(detail.journey?.steps.length, 1);
    assert.equal(detail.deadlines.length, 1);
  });

  test('retrieves catalogue categories with service counts', async () => {
    const mockClient: Queryable = {
      query: async (sql) => {
        assert.match(String(sql), /GROUP BY service_type/);
        return {
          rows: [
            { category: 'SCHEME', count: 12 },
            { category: 'CERTIFICATE', count: 8 },
            { category: 'WELFARE', count: 5 },
          ],
        };
      },
    };

    const categories = await getCatalogueCategories(mockClient);
    assert.equal(categories.length, 3);
    assert.equal(categories[0]?.category, 'SCHEME');
    assert.equal(categories[0]?.count, 12);
  });

  test('retrieves public service sources', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /FROM service_sources\s+WHERE service_id = \$1/);
        assert.deepEqual(params, ['s1']);
        return {
          rows: [
            {
              id: 'src1',
              service_id: 's1',
              source_url: 'https://sevasindhu.karnataka.gov.in',
              source_type: 'OFFICIAL_PORTAL',
              publisher: 'e-Governance Dept',
              verification_status: 'VERIFIED',
              last_verified_at: new Date('2026-11-17T00:00:00Z'),
              retrieved_at: new Date('2026-11-17T00:00:00Z'),
            },
          ],
        };
      },
    };

    const sources = await getPublicServiceSources(mockClient, 's1');
    assert.equal(sources.length, 1);
    assert.equal(sources[0]?.publisher, 'e-Governance Dept');
  });
});
