import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { EligibilityRuleRecord } from '@janasahayak/types';
import {
  evaluateEligibility,
  evaluateEligibilityRequestSchema,
  OFFICIAL_ELIGIBILITY_DISCLAIMER,
} from './eligibility.js';

describe('@janasahayak/validation Eligibility Engine', () => {
  const sampleKarnatakaScholarshipRules: EligibilityRuleRecord[] = [
    {
      id: 'r1',
      serviceId: 's1',
      name: 'Karnataka Domicile',
      ruleExpression: { field: 'stateDomicile', operator: '==', value: true },
      explanation: {
        en: 'Candidate must be a permanent resident of Karnataka.',
        kn: 'ಅಭ್ಯರ್ಥಿಯು ಕರ್ನಾಟಕದ ನಿವಾಸಿಯಾಗಿರಬೇಕು.',
      },
      priority: 1,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
    {
      id: 'r2',
      serviceId: 's1',
      name: 'Family Income Ceiling',
      ruleExpression: { field: 'annualIncome', operator: '<=', value: 250000 },
      explanation: {
        en: 'Annual family income must not exceed ₹2,50,000.',
        kn: 'ವಾರ್ಷಿಕ ಆದಾಯ ರೂ. ೨,೫೦,೦೦೦ ಮೀರಬಾರದು.',
      },
      priority: 2,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
    {
      id: 'r3',
      serviceId: 's1',
      name: 'Higher Education Enrolment',
      ruleExpression: {
        field: 'educationLevel',
        operator: 'in',
        value: ['PUC', 'DIPLOMA', 'UG', 'PG'],
      },
      explanation: {
        en: 'Candidate must be enrolled in post-matric recognized course.',
      },
      priority: 3,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    },
  ];

  it('evaluates POTENTIALLY_ELIGIBLE when all conditions pass', () => {
    const result = evaluateEligibility({
      rules: sampleKarnatakaScholarshipRules,
      answers: {
        stateDomicile: true,
        annualIncome: 180000,
        educationLevel: 'UG',
      },
      language: 'en',
    });

    assert.equal(result.result, 'POTENTIALLY_ELIGIBLE');
    assert.equal(result.matchedRules.length, 3);
    assert.equal(result.unmatchedRules.length, 0);
    assert.equal(result.missingFields.length, 0);
    assert.equal(result.disclaimer, OFFICIAL_ELIGIBILITY_DISCLAIMER);
    assert.ok(result.explanations.some((e) => e.includes('permanent resident')));
  });

  it('evaluates UNLIKELY_ELIGIBLE when a condition fails', () => {
    const result = evaluateEligibility({
      rules: sampleKarnatakaScholarshipRules,
      answers: {
        stateDomicile: true,
        annualIncome: 350000, // exceeds 250,000
        educationLevel: 'UG',
      },
      language: 'en',
    });

    assert.equal(result.result, 'UNLIKELY_ELIGIBLE');
    assert.equal(result.matchedRules.length, 2);
    assert.equal(result.unmatchedRules.length, 1);
    assert.equal(result.unmatchedRules[0]?.ruleId, 'r2');
    assert.equal(result.unmatchedRules[0]?.status, 'FAILED');
    assert.ok(result.unmatchedRules[0]?.reason?.includes('must not exceed 250000'));
  });

  it('evaluates INCOMPLETE_INFO and lists missing fields when answers are absent', () => {
    const result = evaluateEligibility({
      rules: sampleKarnatakaScholarshipRules,
      answers: {
        stateDomicile: true,
        // annualIncome and educationLevel are missing
      },
      language: 'en',
    });

    assert.equal(result.result, 'INCOMPLETE_INFO');
    assert.equal(result.matchedRules.length, 1);
    assert.equal(result.unmatchedRules.length, 2);
    assert.deepEqual(result.missingFields.sort(), ['annualIncome', 'educationLevel'].sort());
  });

  it('prioritizes UNLIKELY_ELIGIBLE if a condition fails even if other answers are missing', () => {
    const result = evaluateEligibility({
      rules: sampleKarnatakaScholarshipRules,
      answers: {
        stateDomicile: false, // Disqualified on domicile
        // annualIncome and educationLevel not answered
      },
      language: 'en',
    });

    assert.equal(result.result, 'UNLIKELY_ELIGIBLE');
    assert.equal(
      result.unmatchedRules.some((r) => r.status === 'FAILED'),
      true,
    );
  });

  it('supports localized Kannada explanations', () => {
    const result = evaluateEligibility({
      rules: sampleKarnatakaScholarshipRules,
      answers: {
        stateDomicile: true,
        annualIncome: 200000,
        educationLevel: 'UG',
      },
      language: 'kn',
    });

    assert.equal(result.result, 'POTENTIALLY_ELIGIBLE');
    assert.ok(result.matchedRules[0]?.explanation.includes('ಕರ್ನಾಟಕದ ನಿವಾಸಿಯಾಗಿರಬೇಕು'));
  });

  it('handles complex nested groups: all, any, and none', () => {
    const complexRules: EligibilityRuleRecord[] = [
      {
        id: 'c1',
        serviceId: 's1',
        name: 'Target Group Eligibility',
        ruleExpression: {
          all: [
            { field: 'age', operator: '>=', value: 18 },
            {
              any: [
                { field: 'casteCategory', operator: 'in', value: ['SC', 'ST', 'OBC'] },
                { field: 'annualIncome', operator: '<=', value: 150000 },
              ],
            },
            {
              none: [{ field: 'employedInGovt', operator: '==', value: true }],
            },
          ],
        },
        explanation: { en: 'Target group eligibility criteria' },
        priority: 1,
        createdAt: '2026-11-10T00:00:00Z',
        updatedAt: '2026-11-10T00:00:00Z',
      },
    ];

    // Case 1: Passes all parts
    const passResult = evaluateEligibility({
      rules: complexRules,
      answers: {
        age: 20,
        casteCategory: 'GENERAL',
        annualIncome: 120000, // matches the "any" branch
        employedInGovt: false, // matches "none"
      },
    });
    assert.equal(passResult.result, 'POTENTIALLY_ELIGIBLE');

    // Case 2: Fails the "none" disqualifier
    const disqualifiedResult = evaluateEligibility({
      rules: complexRules,
      answers: {
        age: 20,
        casteCategory: 'SC',
        employedInGovt: true, // disqualifying
      },
    });
    assert.equal(disqualifiedResult.result, 'UNLIKELY_ELIGIBLE');

    // Case 3: Missing field in "any" when neither branch is satisfied
    const missingResult = evaluateEligibility({
      rules: complexRules,
      answers: {
        age: 20,
        employedInGovt: false,
        // casteCategory and annualIncome both missing
      },
    });
    assert.equal(missingResult.result, 'INCOMPLETE_INFO');
    assert.ok(missingResult.missingFields.includes('casteCategory'));
    assert.ok(missingResult.missingFields.includes('annualIncome'));
  });

  it('coerces string numbers and booleans safely for citizen forms', () => {
    const rule: EligibilityRuleRecord = {
      id: 'r-senior',
      serviceId: 's2',
      name: 'Senior Citizen Age',
      ruleExpression: { field: 'age', operator: '>=', value: 60 },
      explanation: { en: 'Must be at least 60 years old' },
      priority: 1,
      createdAt: '2026-11-10T00:00:00Z',
      updatedAt: '2026-11-10T00:00:00Z',
    };

    const res = evaluateEligibility({
      rules: [rule],
      answers: { age: '65' }, // String number from HTML form input
    });

    assert.equal(res.result, 'POTENTIALLY_ELIGIBLE');
    assert.equal(res.matchedRules.length, 1);
  });

  it('validates request payload schema with Zod', () => {
    const valid = evaluateEligibilityRequestSchema.safeParse({
      answers: {
        stateDomicile: true,
        age: 62,
        category: 'SC',
      },
      language: 'kn',
    });
    assert.equal(valid.success, true);

    const invalid = evaluateEligibilityRequestSchema.safeParse({
      answers: 'not-an-object',
    });
    assert.equal(invalid.success, false);
  });

  it('handles empty rules array gracefully', () => {
    const res = evaluateEligibility({
      rules: [],
      answers: {},
    });
    assert.equal(res.result, 'POTENTIALLY_ELIGIBLE');
    assert.equal(res.matchedRules.length, 0);
    assert.equal(res.unmatchedRules.length, 0);
  });
});
