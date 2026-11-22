import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import type { JourneyStepRecord } from '@janasahayak/types';
import {
  startJourneyParamSchema,
  startJourneyBodySchema,
  completeJourneyStepParamSchema,
  completeJourneyStepBodySchema,
  evaluateStepCompletion,
  computeJourneyProgress,
} from './journeys.js';

describe('Journey Validation & Engine Rules', () => {
  const sampleSteps: JourneyStepRecord[] = [
    {
      id: 'step-1',
      journeyId: 'journey-1',
      stepKey: 'step_eligibility',
      title: 'Check Eligibility',
      description: { en: 'Verify minimum criteria' },
      stepType: 'ELIGIBILITY_CHECK',
      displayOrder: 1,
      officialUrl: null,
      completionRule: { type: 'ELIGIBILITY_EVALUATION' },
    },
    {
      id: 'step-2',
      journeyId: 'journey-1',
      stepKey: 'step_documents',
      title: 'Prepare Documents',
      description: { en: 'Collect Income Certificate' },
      stepType: 'DOCUMENT_CHECK',
      displayOrder: 2,
      officialUrl: 'https://nadakacheri.karnataka.gov.in',
      completionRule: { type: 'DOCUMENT_CHECKLIST' },
    },
    {
      id: 'step-3',
      journeyId: 'journey-1',
      stepKey: 'step_apply',
      title: 'Submit Application',
      description: { en: 'Submit on official portal' },
      stepType: 'OFFICIAL_ACTION',
      displayOrder: 3,
      officialUrl: 'https://ssp.karnataka.gov.in',
      completionRule: { type: 'APPLICATION_REFERENCE', required: true },
    },
  ];

  describe('Schemas', () => {
    it('validates start journey parameter', () => {
      assert.ok(startJourneyParamSchema.parse({ id: 'synthetic-post-matric-scholarship' }));
      assert.throws(() => startJourneyParamSchema.parse({ id: '' }));
    });

    it('validates start journey body with optional user UUID', () => {
      const valid = startJourneyBodySchema.parse({
        userId: 'a0000000-0000-0000-0000-000000000001',
      });
      assert.equal(valid?.userId, 'a0000000-0000-0000-0000-000000000001');

      assert.throws(() => startJourneyBodySchema.parse({ userId: 'not-a-uuid' }));
    });

    it('validates complete step parameter and body', () => {
      assert.ok(
        completeJourneyStepParamSchema.parse({
          id: 'journey-1',
          stepId: 'step-1',
        }),
      );

      const parsedBody = completeJourneyStepBodySchema.parse({
        confirmation: true,
        referenceNumber: 'REF-12345',
        notes: 'Done',
      });
      assert.equal(parsedBody?.referenceNumber, 'REF-12345');
    });
  });

  describe('evaluateStepCompletion', () => {
    it('allows completing step 1 when no prior steps exist', () => {
      const res = evaluateStepCompletion({
        step: sampleSteps[0]!,
        allSteps: sampleSteps,
        completedStepIds: new Set(),
      });
      assert.equal(res.canComplete, true);
    });

    it('blocks completing step 2 if step 1 is not completed (sequential progression)', () => {
      const res = evaluateStepCompletion({
        step: sampleSteps[1]!,
        allSteps: sampleSteps,
        completedStepIds: new Set(),
      });
      assert.equal(res.canComplete, false);
      assert.match(res.reason ?? '', /Previous step "Check Eligibility" must be completed/);
    });

    it('allows completing step 2 if step 1 is already completed', () => {
      const res = evaluateStepCompletion({
        step: sampleSteps[1]!,
        allSteps: sampleSteps,
        completedStepIds: new Set(['step-1']),
      });
      assert.equal(res.canComplete, true);
    });

    it('blocks step 3 if application reference is required but missing', () => {
      const res = evaluateStepCompletion({
        step: sampleSteps[2]!,
        allSteps: sampleSteps,
        completedStepIds: new Set(['step-1', 'step-2']),
        body: {},
      });
      assert.equal(res.canComplete, false);
      assert.match(res.reason ?? '', /reference or acknowledgement number is required/);
    });

    it('allows step 3 if application reference is provided', () => {
      const res = evaluateStepCompletion({
        step: sampleSteps[2]!,
        allSteps: sampleSteps,
        completedStepIds: new Set(['step-1', 'step-2']),
        body: { referenceNumber: 'SSP-2026-999' },
      });
      assert.equal(res.canComplete, true);
    });
  });

  describe('computeJourneyProgress', () => {
    it('computes initial state when 0 steps completed', () => {
      const { progress, stepsWithProgress, nextStep } = computeJourneyProgress(
        sampleSteps,
        new Set(),
      );

      assert.equal(progress.totalSteps, 3);
      assert.equal(progress.completedSteps, 0);
      assert.equal(progress.percentage, 0);
      assert.equal(progress.status, 'NOT_STARTED');
      assert.equal(nextStep?.id, 'step-1');
      assert.equal(stepsWithProgress[0]?.status, 'IN_PROGRESS');
      assert.equal(stepsWithProgress[1]?.status, 'UPCOMING');
    });

    it('computes intermediate state when step 1 completed', () => {
      const { progress, stepsWithProgress, nextStep } = computeJourneyProgress(
        sampleSteps,
        new Set(['step-1']),
      );

      assert.equal(progress.completedSteps, 1);
      assert.equal(progress.percentage, 33);
      assert.equal(progress.status, 'IN_PROGRESS');
      assert.equal(nextStep?.id, 'step-2');
      assert.equal(stepsWithProgress[0]?.status, 'COMPLETED');
      assert.equal(stepsWithProgress[1]?.status, 'IN_PROGRESS');
      assert.equal(stepsWithProgress[2]?.status, 'UPCOMING');
    });

    it('computes completed state when all steps finished', () => {
      const { progress, stepsWithProgress, nextStep } = computeJourneyProgress(
        sampleSteps,
        new Set(['step-1', 'step-2', 'step-3']),
      );

      assert.equal(progress.completedSteps, 3);
      assert.equal(progress.percentage, 100);
      assert.equal(progress.status, 'COMPLETED');
      assert.equal(nextStep, null);
      assert.ok(stepsWithProgress.every((s) => s.status === 'COMPLETED'));
    });
  });
});
