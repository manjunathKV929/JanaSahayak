import { z } from 'zod';
import type {
  DeterministicRuleExpression,
  EligibilityEvaluationResult,
  EligibilityRuleRecord,
  EligibilityStatus,
  FieldCondition,
  RuleEvaluationDetail,
  RuleGroup,
  SupportedLanguage,
} from '@janasahayak/types';

export const OFFICIAL_ELIGIBILITY_DISCLAIMER =
  'Final eligibility is determined by the official authority upon document verification and formal scrutiny.';

// Answer value schema
export const answerValueSchema = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.array(z.string()),
  z.array(z.number()),
]);

// Request schema for evaluating eligibility
export const evaluateEligibilityRequestSchema = z.object({
  answers: z.record(z.string(), answerValueSchema),
  language: z.enum(['en', 'hi', 'kn'] as const).optional(),
});

export type EvaluateEligibilityRequest = z.infer<typeof evaluateEligibilityRequestSchema>;

// Condition evaluation state
type ConditionStatus = 'PASSED' | 'FAILED' | 'MISSING_DATA';

interface ConditionResult {
  status: ConditionStatus;
  missingFields: string[];
  reason?: string | undefined;
}

/**
 * Normalizes values for safe equality comparison.
 */
function normalizeForComparison(val: unknown): unknown {
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (trimmed.toLowerCase() === 'true') return true;
    if (trimmed.toLowerCase() === 'false') return false;
    const num = Number(trimmed);
    if (!isNaN(num) && trimmed !== '') return num;
    return trimmed.toLowerCase();
  }
  return val;
}

/**
 * Evaluates a single atomic field condition against citizen answers.
 */
function evaluateFieldCondition(
  condition: FieldCondition,
  answers: Record<string, unknown>,
): ConditionResult {
  const { field, operator, value: expected } = condition;
  const provided = answers[field];

  if (provided === undefined || provided === null || provided === '') {
    return {
      status: 'MISSING_DATA',
      missingFields: [field],
      reason: `Answer for "${field}" is required to verify this requirement.`,
    };
  }

  const normProvided = normalizeForComparison(provided);
  const normExpected = normalizeForComparison(expected);

  let passed = false;
  let reason: string | undefined;

  switch (operator) {
    case '==':
      passed = normProvided === normExpected;
      if (!passed) {
        reason = `Value for "${field}" was "${String(provided)}", expected "${String(expected)}".`;
      }
      break;

    case '!=':
      passed = normProvided !== normExpected;
      if (!passed) {
        reason = `Value for "${field}" must not be "${String(expected)}".`;
      }
      break;

    case '>': {
      const numProvided = Number(provided);
      const numExpected = Number(expected);
      passed = !isNaN(numProvided) && !isNaN(numExpected) && numProvided > numExpected;
      if (!passed) {
        reason = `Value for "${field}" (${String(provided)}) must be greater than ${String(expected)}.`;
      }
      break;
    }

    case '>=': {
      const numProvided = Number(provided);
      const numExpected = Number(expected);
      passed = !isNaN(numProvided) && !isNaN(numExpected) && numProvided >= numExpected;
      if (!passed) {
        reason = `Value for "${field}" (${String(provided)}) must be at least ${String(expected)}.`;
      }
      break;
    }

    case '<': {
      const numProvided = Number(provided);
      const numExpected = Number(expected);
      passed = !isNaN(numProvided) && !isNaN(numExpected) && numProvided < numExpected;
      if (!passed) {
        reason = `Value for "${field}" (${String(provided)}) must be less than ${String(expected)}.`;
      }
      break;
    }

    case '<=': {
      const numProvided = Number(provided);
      const numExpected = Number(expected);
      passed = !isNaN(numProvided) && !isNaN(numExpected) && numProvided <= numExpected;
      if (!passed) {
        reason = `Value for "${field}" (${String(provided)}) must not exceed ${String(expected)}.`;
      }
      break;
    }

    case 'in': {
      if (Array.isArray(expected)) {
        passed = expected.some((item) => normalizeForComparison(item) === normProvided);
      } else if (typeof expected === 'string') {
        const parts = expected.split(',').map((p) => p.trim().toLowerCase());
        passed = parts.includes(String(normProvided));
      }
      if (!passed) {
        reason = `Value for "${field}" (${String(provided)}) is not in accepted options: ${JSON.stringify(expected)}.`;
      }
      break;
    }

    case 'not_in': {
      if (Array.isArray(expected)) {
        passed = !expected.some((item) => normalizeForComparison(item) === normProvided);
      } else if (typeof expected === 'string') {
        const parts = expected.split(',').map((p) => p.trim().toLowerCase());
        passed = !parts.includes(String(normProvided));
      }
      if (!passed) {
        reason = `Value for "${field}" (${String(provided)}) is in excluded options: ${JSON.stringify(expected)}.`;
      }
      break;
    }

    case 'contains': {
      if (Array.isArray(provided)) {
        passed = provided.some((item) => normalizeForComparison(item) === normExpected);
      } else if (typeof provided === 'string' && typeof expected === 'string') {
        passed = provided.toLowerCase().includes(expected.toLowerCase());
      }
      if (!passed) {
        reason = `Value for "${field}" does not contain expected item "${String(expected)}".`;
      }
      break;
    }

    default:
      passed = false;
      reason = `Unsupported operator "${String(operator)}".`;
  }

  return {
    status: passed ? 'PASSED' : 'FAILED',
    missingFields: [],
    reason: passed ? undefined : reason,
  };
}

/**
 * Checks if expression is an atomic FieldCondition.
 */
function isFieldCondition(expr: DeterministicRuleExpression): expr is FieldCondition {
  return typeof (expr as FieldCondition).field === 'string';
}

/**
 * Recursively evaluates an arbitrary rule group or field condition.
 */
function evaluateRuleExpression(
  expr: DeterministicRuleExpression,
  answers: Record<string, unknown>,
): ConditionResult {
  if (isFieldCondition(expr)) {
    return evaluateFieldCondition(expr, answers);
  }

  const group = expr as RuleGroup;
  const missing: string[] = [];

  // Evaluate "all" group (logical AND)
  if (Array.isArray(group.all) && group.all.length > 0) {
    let hasMissing = false;
    for (const child of group.all) {
      const res = evaluateRuleExpression(child, answers);
      if (res.status === 'FAILED') {
        return {
          status: 'FAILED',
          missingFields: [...missing, ...res.missingFields],
          reason: res.reason,
        };
      }
      if (res.status === 'MISSING_DATA') {
        hasMissing = true;
        missing.push(...res.missingFields);
      }
    }
    if (hasMissing) {
      return { status: 'MISSING_DATA', missingFields: missing };
    }
    return { status: 'PASSED', missingFields: [] };
  }

  // Evaluate "any" group (logical OR)
  if (Array.isArray(group.any) && group.any.length > 0) {
    let hasPassed = false;
    let hasMissing = false;
    const reasons: string[] = [];

    for (const child of group.any) {
      const res = evaluateRuleExpression(child, answers);
      if (res.status === 'PASSED') {
        hasPassed = true;
        break;
      }
      if (res.status === 'MISSING_DATA') {
        hasMissing = true;
        missing.push(...res.missingFields);
      } else if (res.reason) {
        reasons.push(res.reason);
      }
    }

    if (hasPassed) {
      return { status: 'PASSED', missingFields: [] };
    }
    if (hasMissing) {
      return { status: 'MISSING_DATA', missingFields: missing };
    }
    return {
      status: 'FAILED',
      missingFields: [],
      reason: reasons.length > 0 ? reasons.join(' OR ') : 'None of the alternative criteria met.',
    };
  }

  // Evaluate "none" group (logical NOR)
  if (Array.isArray(group.none) && group.none.length > 0) {
    let hasMissing = false;

    for (const child of group.none) {
      const res = evaluateRuleExpression(child, answers);
      if (res.status === 'PASSED') {
        return {
          status: 'FAILED',
          missingFields: [],
          reason: 'A disqualifying criterion was met.',
        };
      }
      if (res.status === 'MISSING_DATA') {
        hasMissing = true;
        missing.push(...res.missingFields);
      }
    }

    if (hasMissing) {
      return { status: 'MISSING_DATA', missingFields: missing };
    }
    return { status: 'PASSED', missingFields: [] };
  }

  // Fallback for empty or unrecognized group
  return { status: 'PASSED', missingFields: [] };
}

export interface EvaluateEligibilityOptions {
  rules: EligibilityRuleRecord[];
  answers: Record<string, unknown>;
  language?: SupportedLanguage | undefined;
}

/**
 * Pure deterministic eligibility evaluator.
 * Evaluates rules without external code execution, strictly enforces data-driven rules,
 * tracks missing answers, and produces localized transparent explanations.
 */
export function evaluateEligibility({
  rules,
  answers,
  language = 'en',
}: EvaluateEligibilityOptions): EligibilityEvaluationResult {
  const matchedRules: RuleEvaluationDetail[] = [];
  const unmatchedRules: RuleEvaluationDetail[] = [];
  const allMissingFields = new Set<string>();
  const explanations: string[] = [];

  // Sort rules by priority (lowest number = highest priority)
  const sortedRules = [...rules].sort((a, b) => a.priority - b.priority);

  let hasFailed = false;
  let hasMissing = false;

  for (const rule of sortedRules) {
    const evalRes = evaluateRuleExpression(rule.ruleExpression, answers);
    const ruleExplanation = rule.explanation[language] ?? rule.explanation['en'] ?? rule.name;

    const detail: RuleEvaluationDetail = {
      ruleId: rule.id,
      ruleName: rule.name,
      status: evalRes.status,
      explanation: ruleExplanation,
      reason: evalRes.reason,
      missingFields: evalRes.missingFields,
    };

    if (evalRes.status === 'PASSED') {
      matchedRules.push(detail);
      explanations.push(`Matched: ${ruleExplanation}`);
    } else if (evalRes.status === 'FAILED') {
      hasFailed = true;
      unmatchedRules.push(detail);
      explanations.push(`Not met: ${ruleExplanation} (${evalRes.reason ?? 'Criteria unmet'})`);
    } else {
      // MISSING_DATA
      hasMissing = true;
      for (const f of evalRes.missingFields) {
        allMissingFields.add(f);
      }
      unmatchedRules.push(detail);
      explanations.push(`Information needed: ${ruleExplanation}`);
    }
  }

  let result: EligibilityStatus;

  if (hasFailed) {
    result = 'UNLIKELY_ELIGIBLE';
  } else if (hasMissing) {
    result = 'INCOMPLETE_INFO';
  } else {
    result = 'POTENTIALLY_ELIGIBLE';
  }

  return {
    result,
    matchedRules,
    unmatchedRules,
    missingFields: Array.from(allMissingFields),
    explanations,
    disclaimer: OFFICIAL_ELIGIBILITY_DISCLAIMER,
  };
}
