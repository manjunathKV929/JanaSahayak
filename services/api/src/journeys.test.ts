import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { buildApp } from './app.js';

describe('Journeys API Routes', () => {
  const fakeDate = new Date('2026-11-20T00:00:00Z');

  const createMockDb = (): Queryable => {
    const completedStepIds = new Set<string>();

    return {
      query: async (sql, params) => {
        const q = String(sql);

        // Service resolution
        if (q.includes('FROM service_records')) {
          const val = params?.[0];
          if (val === 'synthetic-scholarship' || val === 'e0000000-0000-0000-0000-000000000001') {
            return {
              rows: [
                {
                  id: 'e0000000-0000-0000-0000-000000000001',
                  slug: 'synthetic-scholarship',
                  title: 'Post-Matric Scholarship',
                },
              ],
            };
          }
          return { rows: [] };
        }

        // Journey template lookup
        if (q.includes('FROM journeys')) {
          return {
            rows: [
              {
                id: 'j0000000-0000-0000-0000-000000000001',
                service_id: 'e0000000-0000-0000-0000-000000000001',
                title: 'Post-Matric Scholarship Preparation & Application Journey',
                description: 'Step-by-step guidance',
                version: 1,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }

        // Journey steps
        if (q.includes('FROM journey_steps')) {
          return {
            rows: [
              {
                id: 's0000000-0000-0000-0000-000000000001',
                journey_id: 'j0000000-0000-0000-0000-000000000001',
                step_key: 'check_eligibility',
                title: 'Check Eligibility',
                description: { en: 'Verify criteria' },
                step_type: 'ELIGIBILITY_CHECK',
                display_order: 1,
                official_url: null,
                completion_rule: { type: 'ELIGIBILITY_EVALUATION' },
              },
              {
                id: 's0000000-0000-0000-0000-000000000002',
                journey_id: 'j0000000-0000-0000-0000-000000000001',
                step_key: 'prepare_documents',
                title: 'Prepare Required Documents',
                description: { en: 'Gather certificates' },
                step_type: 'DOCUMENT_CHECK',
                display_order: 2,
                official_url: 'https://nadakacheri.karnataka.gov.in',
                completion_rule: { type: 'DOCUMENT_CHECKLIST' },
              },
            ],
          };
        }

        // User journey instance lookup
        if (q.includes('FROM user_journeys uj')) {
          const val = params?.[0];
          if (val === 'ca000000-0000-0000-0000-000000000001') {
            return {
              rows: [
                {
                  id: 'ca000000-0000-0000-0000-000000000001',
                  user_id: 'b0000000-0000-0000-0000-000000000099',
                  journey_id: 'j0000000-0000-0000-0000-000000000001',
                  service_id: 'e0000000-0000-0000-0000-000000000001',
                  status: 'IN_PROGRESS',
                  started_at: fakeDate,
                  completed_at: null,
                  created_at: fakeDate,
                  updated_at: fakeDate,
                  service_slug: 'synthetic-scholarship',
                  service_title: 'Post-Matric Scholarship',
                  journey_title: 'Post-Matric Scholarship Preparation & Application Journey',
                  journey_description: 'Step-by-step guidance',
                  journey_version: 1,
                },
              ],
            };
          }
          return { rows: [] };
        }

        // Existing user journey check
        if (q.includes('FROM user_journeys WHERE user_id')) {
          return { rows: [] };
        }

        // Insert user journey
        if (q.includes('INSERT INTO user_journeys')) {
          return {
            rows: [
              {
                id: 'ca000000-0000-0000-0000-000000000001',
                user_id: 'b0000000-0000-0000-0000-000000000099',
                journey_id: 'j0000000-0000-0000-0000-000000000001',
                service_id: 'e0000000-0000-0000-0000-000000000001',
                status: 'IN_PROGRESS',
                started_at: fakeDate,
                completed_at: null,
                created_at: fakeDate,
                updated_at: fakeDate,
              },
            ],
          };
        }

        // Mark step complete
        if (q.includes('INSERT INTO user_journey_progress') && q.includes('COMPLETED')) {
          const stepId = String(params?.[2]);
          completedStepIds.add(stepId);
          return { rows: [] };
        }

        // Fetch user progress records
        if (q.includes('FROM user_journey_progress')) {
          const rows = [];
          if (completedStepIds.has('s0000000-0000-0000-0000-000000000001')) {
            rows.push({
              id: 'p-1',
              user_id: 'b0000000-0000-0000-0000-000000000099',
              journey_id: 'j0000000-0000-0000-0000-000000000001',
              step_id: 's0000000-0000-0000-0000-000000000001',
              status: 'COMPLETED',
              completed_at: fakeDate,
              created_at: fakeDate,
              updated_at: fakeDate,
            });
          }
          if (completedStepIds.has('s0000000-0000-0000-0000-000000000002')) {
            rows.push({
              id: 'p-2',
              user_id: 'b0000000-0000-0000-0000-000000000099',
              journey_id: 'j0000000-0000-0000-0000-000000000001',
              step_id: 's0000000-0000-0000-0000-000000000002',
              status: 'COMPLETED',
              completed_at: fakeDate,
              created_at: fakeDate,
              updated_at: fakeDate,
            });
          }
          return { rows };
        }

        return { rows: [] };
      },
    };
  };

  const initApp = async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });
    const mockDb = createMockDb();
    const app = await buildApp({
      env,
      db: mockDb,
      logger: false,
      checkDatabase: async () => 'up',
    });
    await app.ready();
    return { app };
  };

  it('POST /api/v1/services/:id/journeys starts an application journey', async () => {
    const { app } = await initApp();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/services/synthetic-scholarship/journeys',
      payload: {},
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.data.serviceSlug, 'synthetic-scholarship');
    assert.equal(body.data.id, 'ca000000-0000-0000-0000-000000000001');
    assert.equal(body.data.progress.totalSteps, 2);
    assert.equal(body.data.progress.completedSteps, 0);
    assert.equal(body.data.nextStep.stepKey, 'check_eligibility');
    assert.equal(body.data.nextStep.status, 'IN_PROGRESS');
  });

  it('GET /api/v1/journeys/:id retrieves journey progress', async () => {
    const { app } = await initApp();

    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/journeys/ca000000-0000-0000-0000-000000000001',
    });

    assert.equal(res.statusCode, 200);
    const body = res.json();
    assert.equal(body.data.serviceSlug, 'synthetic-scholarship');
    assert.equal(body.data.steps.length, 2);
    assert.equal(body.data.steps[0].title, 'Check Eligibility');
  });

  it('POST /api/v1/journeys/:id/steps/:stepId/complete enforces sequential completion', async () => {
    const { app } = await initApp();

    // Attempt to complete step 2 directly without completing step 1
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/journeys/ca000000-0000-0000-0000-000000000001/steps/s0000000-0000-0000-0000-000000000002/complete',
      payload: {},
    });

    assert.equal(res.statusCode, 422);
    const body = res.json();
    assert.equal(body.error.code, 'UNPROCESSABLE_ENTITY');
    assert.match(body.error.message, /Previous step "Check Eligibility" must be completed/);
  });

  it('completes step 1 and advances next step to step 2', async () => {
    const { app } = await initApp();

    // 1. Complete step 1
    const step1Res = await app.inject({
      method: 'POST',
      url: '/api/v1/journeys/ca000000-0000-0000-0000-000000000001/steps/s0000000-0000-0000-0000-000000000001/complete',
      payload: {},
    });

    assert.equal(step1Res.statusCode, 200);
    const step1Body = step1Res.json();
    assert.equal(step1Body.data.progress.completedSteps, 1);
    assert.equal(step1Body.data.progress.percentage, 50);
    assert.equal(step1Body.data.nextStep.stepKey, 'prepare_documents');
    assert.equal(step1Body.data.nextStep.status, 'IN_PROGRESS');

    // 2. Now completing step 2 succeeds
    const step2Res = await app.inject({
      method: 'POST',
      url: '/api/v1/journeys/ca000000-0000-0000-0000-000000000001/steps/s0000000-0000-0000-0000-000000000002/complete',
      payload: {},
    });

    assert.equal(step2Res.statusCode, 200);
    const step2Body = step2Res.json();
    assert.equal(step2Body.data.progress.completedSteps, 2);
    assert.equal(step2Body.data.progress.percentage, 100);
    assert.equal(step2Body.data.progress.status, 'COMPLETED');
    assert.equal(step2Body.data.nextStep, null);
  });
});
