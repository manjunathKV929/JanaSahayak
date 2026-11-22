import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Queryable } from './client.js';
import {
  getJourneyWithSteps,
  getJourneyByService,
  createOrResumeUserJourney,
  getUserJourneyInstance,
  completeUserJourneyStep,
} from './schema/journeys.js';

describe('@janasahayak/db Journey Engine Repository', () => {
  const fakeDate = new Date('2026-11-20T00:00:00Z');

  it('retrieves journey template with steps by serviceId', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        if (String(sql).includes('FROM journeys')) {
          assert.equal(params?.[0], 'service-uuid-1');
          return {
            rows: [
              {
                id: 'journey-1',
                service_id: 'service-uuid-1',
                title: 'Scholarship Application Journey',
                description: 'Step-by-step guidance',
                version: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (String(sql).includes('FROM journey_steps')) {
          assert.equal(params?.[0], 'journey-1');
          return {
            rows: [
              {
                id: 'step-1',
                journey_id: 'journey-1',
                step_key: 'check_eligibility',
                title: 'Check Eligibility',
                description: { en: 'Verify criteria' },
                step_type: 'ELIGIBILITY_CHECK',
                display_order: 1,
                official_url: null,
                completion_rule: { type: 'ELIGIBILITY_EVALUATION' },
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const bundle = await getJourneyWithSteps(mockClient, 'service-uuid-1');
    assert.ok(bundle);
    assert.equal(bundle.journey.id, 'journey-1');
    assert.equal(bundle.steps.length, 1);
    assert.equal(bundle.steps[0]?.stepKey, 'check_eligibility');
  });

  it('resolves journey by service slug', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        if (String(sql).includes('FROM service_records WHERE slug')) {
          assert.equal(params?.[0], 'synthetic-scholarship');
          return {
            rows: [{ id: 'service-1', slug: 'synthetic-scholarship', title: 'Scholarship' }],
          };
        }
        if (String(sql).includes('FROM journeys')) {
          return {
            rows: [
              {
                id: 'journey-1',
                service_id: 'service-1',
                title: 'Journey 1',
                description: 'Desc',
                version: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (String(sql).includes('FROM journey_steps')) {
          return {
            rows: [
              {
                id: 'step-1',
                journey_id: 'journey-1',
                step_key: 'step_1',
                title: 'Step 1',
                description: { en: 'Desc' },
                step_type: 'DOCUMENT_CHECK',
                display_order: 1,
                official_url: null,
                completion_rule: null,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const result = await getJourneyByService(mockClient, 'synthetic-scholarship');
    assert.ok(result);
    assert.equal(result.service.slug, 'synthetic-scholarship');
    assert.equal(result.journey.id, 'journey-1');
    assert.equal(result.steps.length, 1);
  });

  it('creates or resumes user journey and seeds step progress', async () => {
    let insertedUserJourney = false;
    let seededProgress = false;

    const mockClient: Queryable = {
      query: async (sql) => {
        const queryStr = String(sql);
        if (queryStr.includes('FROM service_records')) {
          return {
            rows: [{ id: 's-1', slug: 'test-slug', title: 'Test Service' }],
          };
        }
        if (queryStr.includes('FROM journeys')) {
          return {
            rows: [
              {
                id: 'j-1',
                service_id: 's-1',
                title: 'Test Journey',
                description: 'Test Desc',
                version: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (queryStr.includes('FROM journey_steps')) {
          return {
            rows: [
              {
                id: 'st-1',
                journey_id: 'j-1',
                step_key: 'step-one',
                title: 'Step One',
                description: { en: 'Description' },
                step_type: 'ACTION',
                display_order: 1,
                official_url: 'https://example.gov.in',
                completion_rule: null,
              },
            ],
          };
        }
        if (
          queryStr.includes(
            'SELECT id, user_id, journey_id, service_id, status FROM user_journeys',
          ) ||
          queryStr.includes('FROM user_journeys WHERE user_id')
        ) {
          return { rows: [] };
        }
        if (queryStr.includes('INSERT INTO user_journeys')) {
          insertedUserJourney = true;
          return {
            rows: [
              {
                id: 'uj-1',
                user_id: 'u-1',
                journey_id: 'j-1',
                service_id: 's-1',
                status: 'IN_PROGRESS',
                started_at: fakeDate,
                completed_at: null,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (queryStr.includes('INSERT INTO user_journey_progress')) {
          seededProgress = true;
          return { rows: [] };
        }
        if (queryStr.includes('FROM user_journey_progress')) {
          return {
            rows: [
              {
                id: 'p-1',
                user_id: 'u-1',
                journey_id: 'j-1',
                step_id: 'st-1',
                status: 'PENDING',
                completed_at: null,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const bundle = await createOrResumeUserJourney(mockClient, 'test-slug', 'u-1');
    assert.ok(bundle);
    assert.equal(insertedUserJourney, true);
    assert.equal(seededProgress, true);
    assert.equal(bundle.userJourney.id, 'uj-1');
    assert.equal(bundle.steps.length, 1);
    assert.equal(bundle.progressRecords.length, 1);
  });

  it('retrieves user journey instance by user_journeys UUID', async () => {
    const mockClient: Queryable = {
      query: async (sql) => {
        const queryStr = String(sql);
        if (queryStr.includes('FROM user_journeys uj')) {
          return {
            rows: [
              {
                id: 'uj-99',
                user_id: 'u-1',
                journey_id: 'j-1',
                service_id: 's-1',
                status: 'IN_PROGRESS',
                started_at: fakeDate,
                completed_at: null,
                created_at: fakeDate,
                updated_at: fakeDate,
                service_slug: 'test-slug',
                service_title: 'Test Service',
                journey_title: 'Journey Title',
                journey_description: 'Journey Desc',
                journey_version: 1,
              },
            ],
          };
        }
        if (queryStr.includes('FROM journey_steps')) {
          return {
            rows: [
              {
                id: 'st-1',
                journey_id: 'j-1',
                step_key: 'step-1',
                title: 'Step 1',
                description: { en: 'Desc' },
                step_type: 'ACTION',
                display_order: 1,
                official_url: null,
                completion_rule: null,
              },
            ],
          };
        }
        if (queryStr.includes('FROM user_journey_progress')) {
          return {
            rows: [
              {
                id: 'p-1',
                user_id: 'u-1',
                journey_id: 'j-1',
                step_id: 'st-1',
                status: 'PENDING',
                completed_at: null,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        return { rows: [] };
      },
    };

    const instance = await getUserJourneyInstance(
      mockClient,
      '00000000-0000-0000-0000-000000000099',
      'u-1',
    );
    assert.ok(instance);
    assert.equal(instance.userJourney.id, 'uj-99');
    assert.equal(instance.service.slug, 'test-slug');
  });

  it('completes user journey step', async () => {
    let stepCompleted = false;

    const mockClient: Queryable = {
      query: async (sql) => {
        const queryStr = String(sql);
        if (queryStr.includes('FROM user_journeys uj')) {
          return {
            rows: [
              {
                id: '00000000-0000-0000-0000-000000000099',
                user_id: 'u-1',
                journey_id: 'j-1',
                service_id: 's-1',
                status: 'IN_PROGRESS',
                started_at: fakeDate,
                completed_at: null,
                created_at: fakeDate,
                updated_at: fakeDate,
                service_slug: 'test-slug',
                service_title: 'Test Service',
                journey_title: 'Journey Title',
                journey_description: 'Journey Desc',
                journey_version: 1,
              },
            ],
          };
        }
        if (queryStr.includes('FROM journey_steps')) {
          return {
            rows: [
              {
                id: 'st-1',
                journey_id: 'j-1',
                step_key: 'step-1',
                title: 'Step 1',
                description: { en: 'Desc' },
                step_type: 'ACTION',
                display_order: 1,
                official_url: null,
                completion_rule: null,
              },
            ],
          };
        }
        if (
          queryStr.includes('INSERT INTO user_journey_progress') &&
          queryStr.includes('COMPLETED')
        ) {
          stepCompleted = true;
          return { rows: [] };
        }
        if (queryStr.includes('FROM user_journey_progress')) {
          return {
            rows: [
              {
                id: 'p-1',
                user_id: 'u-1',
                journey_id: 'j-1',
                step_id: 'st-1',
                status: stepCompleted ? 'COMPLETED' : 'PENDING',
                completed_at: stepCompleted ? fakeDate : null,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }
        if (queryStr.includes('UPDATE user_journeys SET status')) {
          return { rows: [] };
        }
        return { rows: [] };
      },
    };

    const updated = await completeUserJourneyStep(
      mockClient,
      '00000000-0000-0000-0000-000000000099',
      'st-1',
      'u-1',
    );
    assert.ok(updated);
    assert.equal(stepCompleted, true);
  });
});
