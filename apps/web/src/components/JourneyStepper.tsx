'use client';

import React, { useState, useEffect } from 'react';
import type {
  JourneyStepRecord,
  JourneyStepWithProgress,
  PublicServiceDetail,
  UserJourneyDetail,
} from '@janasahayak/types';
import { Card, Button } from '@janasahayak/ui';
import { completeJourneyStep, fetchJourneyForService } from '../lib/catalogue';

export interface JourneyStepperProps {
  service: PublicServiceDetail;
  initialJourney?: UserJourneyDetail | null;
  language?: import('@janasahayak/types').SupportedLanguage;
}

function StatusBadge({
  variant,
  children,
}: {
  variant: 'success' | 'info' | 'warning' | 'neutral';
  children: React.ReactNode;
}) {
  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    info: 'bg-sky-50 text-sky-800 border-sky-200',
    warning: 'bg-amber-50 text-amber-800 border-amber-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  }[variant];
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles}`}
    >
      {children}
    </span>
  );
}

export function JourneyStepper({ service, initialJourney, language = 'en' }: JourneyStepperProps) {
  const [journey, setJourney] = useState<UserJourneyDetail | null>(initialJourney ?? null);
  const [loading, setLoading] = useState<boolean>(!initialJourney);
  const [completingStepId, setCompletingStepId] = useState<string | null>(null);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const storageKey = `janasahayak_journey_progress_${service.service.slug}`;

  // Load journey on mount if not provided
  useEffect(() => {
    let isMounted = true;
    async function load() {
      try {
        const loaded = await fetchJourneyForService(service.service.slug);
        if (isMounted && loaded) {
          // Check local storage for any locally completed steps
          const savedLocal = localStorage.getItem(storageKey);
          if (savedLocal) {
            try {
              const localCompleted: string[] = JSON.parse(savedLocal);
              if (Array.isArray(localCompleted) && localCompleted.length > 0) {
                // Apply locally saved completed steps if needed
                for (const step of loaded.steps) {
                  if (localCompleted.includes(step.id) || localCompleted.includes(step.stepKey)) {
                    step.status = 'COMPLETED';
                  }
                }
                const completedCount = loaded.steps.filter(
                  (s: JourneyStepWithProgress) => s.status === 'COMPLETED',
                ).length;
                loaded.progress.completedSteps = completedCount;
                loaded.progress.percentage = Math.round(
                  (completedCount / loaded.steps.length) * 100,
                );
                loaded.progress.status =
                  completedCount === loaded.steps.length ? 'COMPLETED' : 'IN_PROGRESS';
                loaded.nextStep =
                  loaded.steps.find((s: JourneyStepWithProgress) => s.status !== 'COMPLETED') ??
                  null;
              }
            } catch {
              // Ignore local parse errors
            }
          }
          setJourney(loaded);
        }
      } catch (err) {
        console.error('Failed to load journey:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [service.service.slug, storageKey]);

  // Handle completing a step
  const handleCompleteStep = async (step: JourneyStepRecord) => {
    if (!journey) return;
    setErrorNotice(null);
    setCompletingStepId(step.id);

    try {
      const trimmedRef = referenceNumber.trim();
      const updated = await completeJourneyStep(journey.id, step.id, {
        confirmation: true,
        ...(trimmedRef ? { referenceNumber: trimmedRef } : {}),
      });

      if (updated) {
        setJourney(updated);
        // Persist completed steps in localStorage
        const completedIds = updated.steps
          .filter((s: JourneyStepWithProgress) => s.status === 'COMPLETED')
          .map((s: JourneyStepWithProgress) => s.id);
        localStorage.setItem(storageKey, JSON.stringify(completedIds));
        setReferenceNumber('');
      } else {
        // Fallback local update
        const updatedSteps: JourneyStepWithProgress[] = journey.steps.map(
          (s: JourneyStepWithProgress) => {
            if (s.id === step.id) {
              return { ...s, status: 'COMPLETED' as const, completedAt: new Date().toISOString() };
            }
            return s;
          },
        );
        const completedCount = updatedSteps.filter(
          (s: JourneyStepWithProgress) => s.status === 'COMPLETED',
        ).length;
        const total = updatedSteps.length;
        const percentage = Math.round((completedCount / total) * 100);
        const next =
          updatedSteps.find((s: JourneyStepWithProgress) => s.status !== 'COMPLETED') ?? null;

        const updatedLocal: UserJourneyDetail = {
          ...journey,
          steps: updatedSteps,
          nextStep: next,
          progress: {
            ...journey.progress,
            completedSteps: completedCount,
            percentage,
            status: completedCount === total ? 'COMPLETED' : 'IN_PROGRESS',
            nextStep: next,
          },
        };
        setJourney(updatedLocal);
        const completedIds = updatedSteps
          .filter((s: JourneyStepWithProgress) => s.status === 'COMPLETED')
          .map((s: JourneyStepWithProgress) => s.id);
        localStorage.setItem(storageKey, JSON.stringify(completedIds));
        setReferenceNumber('');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unable to complete this step right now.';
      setErrorNotice(msg);
    } finally {
      setCompletingStepId(null);
    }
  };

  const handleResetProgress = () => {
    localStorage.removeItem(storageKey);
    window.location.reload();
  };

  if (loading) {
    return (
      <div
        className="rounded-xl border border-border bg-surface p-8 text-center"
        aria-live="polite"
      >
        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <p className="mt-3 text-sm text-text-muted">Loading step-by-step application journey...</p>
      </div>
    );
  }

  if (!journey || journey.steps.length === 0) {
    return null;
  }

  const { progress, nextStep, steps } = journey;

  return (
    <div className="space-y-6" id="application-journey-section">
      {/* Live progress announcement for screen readers */}
      <div className="sr-only" role="status" aria-live="polite">
        Application journey progress: {progress.completedSteps} of {progress.totalSteps} steps
        completed ({progress.percentage}%).
        {nextStep ? ` Active next step: ${nextStep.title}.` : ' All steps completed.'}
      </div>

      {/* Progress Meter */}
      <div className="rounded-xl border border-border bg-surface p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-text-primary">
                Application Journey Progress
              </h3>
              {progress.status === 'COMPLETED' ? (
                <StatusBadge variant="success">All Steps Completed</StatusBadge>
              ) : (
                <StatusBadge variant="info">In Progress</StatusBadge>
              )}
            </div>
            <p className="text-xs text-text-muted mt-0.5">
              Follow these sequential steps before and during your official portal submission.
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-semibold text-text-primary">
              {progress.completedSteps} of {progress.totalSteps} Steps Complete (
              {progress.percentage}%)
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div
          className="mt-3 h-2.5 w-full overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-valuenow={progress.percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label="Journey progress bar"
        >
          <div
            className={`h-full transition-all duration-500 ease-out ${
              progress.percentage === 100 ? 'bg-emerald-600' : 'bg-primary'
            }`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      {/* Error Alert if any */}
      {errorNotice && (
        <div
          className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800"
          role="alert"
        >
          <p className="font-semibold">Unable to complete step</p>
          <p className="mt-1 text-xs">{errorNotice}</p>
        </div>
      )}

      {/* SIGNATURE COMPONENT: YOUR NEXT STEP (DESIGN.md Section 47) */}
      {nextStep && (
        <div className="relative overflow-hidden rounded-xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 via-surface to-surface p-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border/60 pb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              YOUR NEXT STEP
            </span>
            <StatusBadge variant="warning">Action Required</StatusBadge>
          </div>

          <div className="mt-4 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary font-bold text-white text-sm">
                  {String(nextStep.displayOrder).padStart(2, '0')}
                </span>
                <h4 className="text-lg font-bold text-text-primary">{nextStep.title}</h4>
              </div>
              <p className="text-sm text-text-muted pl-11">
                {nextStep.description[language] ||
                  nextStep.description['en'] ||
                  Object.values(nextStep.description)[0]}
              </p>

              {/* Official Action Link if provided */}
              {nextStep.officialUrl && (
                <div className="pl-11 pt-2 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={nextStep.officialUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary/90 transition-colors focus:ring-2 focus:ring-primary focus:outline-none"
                    >
                      <span>Proceed on Official Portal</span>
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                    <StatusBadge variant="neutral">Verified Official Government Portal</StatusBadge>
                  </div>
                  <p className="text-xs text-amber-800 bg-amber-50 rounded-md p-2 border border-amber-200">
                    <strong>Safety Notice:</strong> You will be redirected to the verified
                    government portal. Never share your Aadhaar OTP, password, or bank PIN with
                    anyone.
                  </p>
                </div>
              )}

              {/* Application reference input if rule asks for it */}
              {(nextStep.completionRule as Record<string, unknown> | null)?.type ===
                'APPLICATION_REFERENCE' && (
                <div className="pl-11 pt-2 max-w-sm">
                  <label
                    htmlFor="ref-input"
                    className="block text-xs font-medium text-text-primary"
                  >
                    Application / Acknowledgment Number (optional):
                  </label>
                  <input
                    id="ref-input"
                    type="text"
                    value={referenceNumber}
                    onChange={(e) => setReferenceNumber(e.target.value)}
                    placeholder="e.g. SSP-2026-XXXXXX"
                    className="mt-1 block w-full rounded-md border border-border px-3 py-1.5 text-sm focus:border-primary focus:outline-none"
                  />
                </div>
              )}
            </div>

            {/* Complete step action button */}
            <div className="pl-11 md:pl-0 shrink-0">
              <Button
                variant="primary"
                onClick={() => handleCompleteStep(nextStep)}
                disabled={completingStepId === nextStep.id}
                className="w-full md:w-auto"
              >
                {completingStepId === nextStep.id ? 'Updating...' : 'Mark Step as Done ✓'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* When all steps completed banner */}
      {progress.status === 'COMPLETED' && (
        <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-6 text-center shadow-sm">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h4 className="mt-3 text-lg font-bold text-emerald-900">All Journey Steps Completed!</h4>
          <p className="mt-1 text-sm text-emerald-700">
            You have successfully prepared and submitted your application for{' '}
            {service.service.title}.
          </p>
          <div className="mt-4">
            <button
              onClick={handleResetProgress}
              className="text-xs text-emerald-800 underline hover:text-emerald-900"
            >
              Reset progress and start over
            </button>
          </div>
        </div>
      )}

      {/* Step by Step Timeline */}
      <Card title="All Journey Steps">
        <ol className="space-y-6 pt-2 list-none p-0">
          {steps.map((step: JourneyStepWithProgress, index: number) => {
            const isCompleted = step.status === 'COMPLETED';
            const isCurrent = step.status === 'IN_PROGRESS';

            return (
              <li
                key={step.id}
                aria-current={isCurrent ? 'step' : undefined}
                className="relative flex items-start gap-4"
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div
                    className={`absolute left-4 top-8 -bottom-6 w-0.5 ${
                      isCompleted ? 'bg-emerald-500' : 'bg-border'
                    }`}
                    aria-hidden="true"
                  />
                )}

                {/* Step indicator circle */}
                <div
                  className={`relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-bold text-xs ${
                    isCompleted
                      ? 'bg-emerald-600 text-white'
                      : isCurrent
                        ? 'bg-primary text-white ring-4 ring-primary/20'
                        : 'border border-border bg-surface text-text-muted'
                  }`}
                >
                  {isCompleted ? (
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  ) : (
                    String(step.displayOrder).padStart(2, '0')
                  )}
                </div>

                {/* Step body */}
                <div className="flex-1 pb-2">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                    <h5
                      className={`text-sm font-semibold ${
                        isCompleted
                          ? 'text-text-primary line-through opacity-80'
                          : isCurrent
                            ? 'text-primary font-bold'
                            : 'text-text-primary'
                      }`}
                    >
                      {step.title}
                    </h5>
                    <div>
                      {isCompleted ? (
                        <StatusBadge variant="success">Completed</StatusBadge>
                      ) : isCurrent ? (
                        <StatusBadge variant="info">In Progress</StatusBadge>
                      ) : (
                        <StatusBadge variant="neutral">Upcoming</StatusBadge>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-xs text-text-muted">
                    {step.description[language] ||
                      step.description['en'] ||
                      Object.values(step.description)[0]}
                  </p>

                  {/* Actions for current step */}
                  {isCurrent && (
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      {step.officialUrl && (
                        <a
                          href={step.officialUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs font-semibold text-primary underline hover:text-primary/80 inline-flex items-center gap-1"
                        >
                          <span>Open Official Portal</span>
                          <svg
                            className="h-3 w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleCompleteStep(step)}
                        disabled={completingStepId === step.id}
                      >
                        {completingStepId === step.id ? 'Completing...' : 'Mark as Done'}
                      </Button>
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </Card>
    </div>
  );
}
