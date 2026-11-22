import { z } from 'zod';
import type {
  JourneyProgressSummary,
  JourneyStepRecord,
  JourneyStepWithProgress,
  StepExecutionStatus,
} from '@janasahayak/types';

export const startJourneyParamSchema = z.object({
  id: z.string().trim().min(1, 'Service identifier is required').max(128),
});

export const startJourneyBodySchema = z
  .object({
    userId: z.string().uuid('Invalid user UUID').optional(),
    anonymousSessionId: z.string().trim().max(128).optional(),
  })
  .optional();

export const getJourneyParamSchema = z.object({
  id: z.string().trim().min(1, 'Journey identifier is required').max(128),
});

export const getJourneyQuerySchema = z
  .object({
    userId: z.string().uuid('Invalid user UUID').optional(),
  })
  .optional();

export const completeJourneyStepParamSchema = z.object({
  id: z.string().trim().min(1, 'Journey identifier is required').max(128),
  stepId: z.string().trim().min(1, 'Step identifier is required').max(128),
});

export const completeJourneyStepBodySchema = z
  .object({
    confirmation: z.boolean().optional(),
    referenceNumber: z.string().trim().max(128).optional(),
    notes: z.string().trim().max(500).optional(),
  })
  .optional();

export type StartJourneyParam = z.infer<typeof startJourneyParamSchema>;
export type StartJourneyBody = z.infer<typeof startJourneyBodySchema>;
export type GetJourneyParam = z.infer<typeof getJourneyParamSchema>;
export type GetJourneyQuery = z.infer<typeof getJourneyQuerySchema>;
export type CompleteJourneyStepParam = z.infer<typeof completeJourneyStepParamSchema>;
export type CompleteJourneyStepBody = z.infer<typeof completeJourneyStepBodySchema>;

export interface CompletionEvaluationInput {
  step: JourneyStepRecord;
  allSteps: JourneyStepRecord[];
  completedStepIds: Set<string>;
  body?: CompleteJourneyStepBody;
}

export interface CompletionEvaluationResult {
  canComplete: boolean;
  reason?: string;
}

/**
 * Pure deterministic validation of journey step completion.
 * Enforces sequential progression and completion rules.
 */
export function evaluateStepCompletion(
  input: CompletionEvaluationInput,
): CompletionEvaluationResult {
  const { step, allSteps, completedStepIds, body } = input;

  // 1. If already completed, can always re-validate
  if (completedStepIds.has(step.id)) {
    return { canComplete: true };
  }

  // 2. Sequential progression: all steps with a lower display_order must be completed first
  const sortedSteps = [...allSteps].sort((a, b) => a.displayOrder - b.displayOrder);
  const priorIncompleteSteps = sortedSteps.filter(
    (s) => s.displayOrder < step.displayOrder && !completedStepIds.has(s.id),
  );

  if (priorIncompleteSteps.length > 0) {
    const priorStep = priorIncompleteSteps[0];
    return {
      canComplete: false,
      reason: `Previous step "${priorStep?.title}" must be completed before starting this step.`,
    };
  }

  // 3. Evaluate step-specific completion rule
  const rule = step.completionRule;
  if (rule && typeof rule === 'object') {
    const ruleType = (rule as Record<string, unknown>).type;
    const isRequired = (rule as Record<string, unknown>).required === true;

    if (ruleType === 'MANUAL_CONFIRMATION' && body?.confirmation === false) {
      return {
        canComplete: false,
        reason: 'Confirmation is required to complete this step.',
      };
    }

    if (ruleType === 'APPLICATION_REFERENCE' && isRequired && !body?.referenceNumber) {
      return {
        canComplete: false,
        reason: 'Application reference or acknowledgement number is required.',
      };
    }
  }

  return { canComplete: true };
}

/**
 * Computes live step statuses and overall progress for a journey.
 */
export function computeJourneyProgress(
  steps: JourneyStepRecord[],
  completedStepIds: Set<string>,
): {
  progress: JourneyProgressSummary;
  stepsWithProgress: JourneyStepWithProgress[];
  nextStep: JourneyStepWithProgress | null;
} {
  const sortedSteps = [...steps].sort((a, b) => a.displayOrder - b.displayOrder);
  const totalSteps = sortedSteps.length;
  const completedSteps = sortedSteps.filter((s) => completedStepIds.has(s.id)).length;
  const percentage = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  let currentStepAssigned = false;
  let nextStepRecord: JourneyStepWithProgress | null = null;

  const stepsWithProgress: JourneyStepWithProgress[] = sortedSteps.map((step, index) => {
    const isCompleted = completedStepIds.has(step.id);
    let status: StepExecutionStatus = 'UPCOMING';
    let isNextStep = false;

    if (isCompleted) {
      status = 'COMPLETED';
    } else if (!currentStepAssigned) {
      status = 'IN_PROGRESS';
      isNextStep = true;
      currentStepAssigned = true;
    } else if (
      currentStepAssigned &&
      !nextStepRecord &&
      sortedSteps[index - 1] &&
      completedStepIds.has(sortedSteps[index - 1]!.id)
    ) {
      status = 'NEXT';
    } else {
      status = 'UPCOMING';
    }

    const canCompleteResult = evaluateStepCompletion({
      step,
      allSteps: sortedSteps,
      completedStepIds,
    });

    const stepWithProgress: JourneyStepWithProgress = {
      ...step,
      status,
      completedAt: isCompleted ? new Date().toISOString() : null,
      isNextStep,
      canComplete: canCompleteResult.canComplete,
    };

    if (isNextStep) {
      nextStepRecord = stepWithProgress;
    }

    return stepWithProgress;
  });

  const overallStatus: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' =
    completedSteps === 0
      ? 'NOT_STARTED'
      : completedSteps === totalSteps
        ? 'COMPLETED'
        : 'IN_PROGRESS';

  const currentStepIndex = stepsWithProgress.findIndex((s) => s.isNextStep);

  const progress: JourneyProgressSummary = {
    totalSteps,
    completedSteps,
    currentStepIndex: currentStepIndex >= 0 ? currentStepIndex : completedSteps,
    percentage,
    status: overallStatus,
    nextStep: nextStepRecord,
  };

  return {
    progress,
    stepsWithProgress,
    nextStep: nextStepRecord,
  };
}
