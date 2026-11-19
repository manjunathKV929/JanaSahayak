'use client';

import React, { useState } from 'react';
import type {
  EligibilityEvaluationResult,
  EligibilityRuleRecord,
  SupportedLanguage,
} from '@janasahayak/types';
import { Alert, Button, Card, Heading, Text } from '@janasahayak/ui';
import { evaluateEligibility, OFFICIAL_ELIGIBILITY_DISCLAIMER } from '@janasahayak/validation';

export interface QuestionnaireQuestion {
  id: string;
  key: string;
  questionText: Record<string, string>;
  answerType: 'text' | 'number' | 'boolean' | 'single_choice' | 'multi_choice';
  required: boolean;
  options?: Array<{
    id: string;
    key: string;
    label: Record<string, string>;
  }>;
}

export interface EligibilityCheckerProps {
  serviceId: string;
  serviceTitle: string;
  rules: EligibilityRuleRecord[];
  questions: QuestionnaireQuestion[];
  language?: SupportedLanguage;
}

export function EligibilityChecker({ rules, questions, language = 'en' }: EligibilityCheckerProps) {
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [evaluation, setEvaluation] = useState<EligibilityEvaluationResult | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  const handleInputChange = (key: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleEvaluate = (e: React.FormEvent) => {
    e.preventDefault();
    setIsEvaluating(true);

    try {
      const result = evaluateEligibility({
        rules,
        answers,
        language,
      });
      setEvaluation(result);
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setEvaluation(null);
  };

  if (questions.length === 0 && rules.length === 0) {
    return null;
  }

  return (
    <section aria-labelledby="eligibility-checker-heading" className="space-y-6">
      <div className="space-y-1">
        <Heading as="h2" size="h2" id="eligibility-checker-heading" className="text-civic-navy">
          Check If You May Qualify
        </Heading>
        <Text size="small" className="text-civic-muted">
          Answer a few quick questions to deterministically evaluate your eligibility against
          official criteria. Your answers remain private in your browser.
        </Text>
      </div>

      <Card variant="bordered" className="p-6 bg-white space-y-6">
        <form onSubmit={handleEvaluate} className="space-y-6">
          <div className="space-y-5">
            {questions.map((q, idx) => {
              const label = q.questionText[language] ?? q.questionText['en'] ?? q.key;
              const val = answers[q.key];

              return (
                <div
                  key={q.id || q.key}
                  className="space-y-2 border-b border-civic-border/50 pb-5 last:border-b-0"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-civic-navy/10 text-civic-navy text-xs font-bold flex items-center justify-center font-heading">
                      {idx + 1}
                    </span>
                    <label
                      htmlFor={`field-${q.key}`}
                      className="text-sm font-bold text-civic-navy font-heading"
                    >
                      {label}
                      {q.required && <span className="text-civic-crimson ml-1">*</span>}
                    </label>
                  </div>

                  {q.answerType === 'single_choice' && q.options && q.options.length > 0 ? (
                    <div className="space-y-2 pt-1 pl-7">
                      {q.options.map((opt) => (
                        <label
                          key={opt.key}
                          className="flex items-center gap-3 p-3 rounded border border-civic-border hover:bg-civic-surface cursor-pointer text-sm font-medium text-civic-charcoal transition-colors"
                        >
                          <input
                            type="radio"
                            name={q.key}
                            value={opt.key}
                            checked={val === opt.key}
                            onChange={() => handleInputChange(q.key, opt.key)}
                            className="w-4 h-4 text-civic-navy border-civic-border focus:ring-civic-navy"
                          />
                          <span>{opt.label[language] ?? opt.label['en'] ?? opt.key}</span>
                        </label>
                      ))}
                    </div>
                  ) : q.answerType === 'boolean' ? (
                    <div className="flex gap-3 pt-1 pl-7">
                      <label className="flex items-center gap-2 px-4 py-2 rounded border border-civic-border hover:bg-civic-surface cursor-pointer text-sm font-medium text-civic-charcoal">
                        <input
                          type="radio"
                          name={q.key}
                          value="true"
                          checked={val === true}
                          onChange={() => handleInputChange(q.key, true)}
                          className="w-4 h-4 text-civic-navy"
                        />
                        <span>Yes</span>
                      </label>
                      <label className="flex items-center gap-2 px-4 py-2 rounded border border-civic-border hover:bg-civic-surface cursor-pointer text-sm font-medium text-civic-charcoal">
                        <input
                          type="radio"
                          name={q.key}
                          value="false"
                          checked={val === false}
                          onChange={() => handleInputChange(q.key, false)}
                          className="w-4 h-4 text-civic-navy"
                        />
                        <span>No</span>
                      </label>
                    </div>
                  ) : (
                    <div className="pl-7">
                      <input
                        id={`field-${q.key}`}
                        type={q.answerType === 'number' ? 'number' : 'text'}
                        value={val !== undefined ? String(val) : ''}
                        onChange={(e) =>
                          handleInputChange(
                            q.key,
                            q.answerType === 'number' && e.target.value !== ''
                              ? Number(e.target.value)
                              : e.target.value,
                          )
                        }
                        placeholder={
                          q.answerType === 'number'
                            ? 'Enter number (e.g. 150000)'
                            : 'Enter your answer'
                        }
                        className="w-full max-w-sm rounded border border-civic-border px-3.5 py-2 text-sm text-civic-charcoal focus:border-civic-navy focus:outline-none min-h-[44px]"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" variant="primary" loading={isEvaluating}>
              Check Eligibility
            </Button>
            {evaluation && (
              <Button type="button" variant="secondary" onClick={handleReset}>
                Reset
              </Button>
            )}
          </div>
        </form>

        {/* Evaluation Result Presentation */}
        {evaluation && (
          <div className="border-t border-civic-border pt-6 space-y-4" aria-live="polite">
            {evaluation.result === 'POTENTIALLY_ELIGIBLE' && (
              <Alert variant="success" title="You May Qualify">
                <div className="space-y-3">
                  <p>
                    Based on the answers you provided, you appear to meet the primary eligibility
                    requirements for this service.
                  </p>
                  {evaluation.matchedRules.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                        Matched Requirements:
                      </p>
                      <ul className="space-y-1 text-xs">
                        {evaluation.matchedRules.map((mr) => (
                          <li key={mr.ruleId} className="flex items-start gap-2">
                            <span className="text-civic-green font-bold">✓</span>
                            <span>{mr.explanation}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Alert>
            )}

            {evaluation.result === 'UNLIKELY_ELIGIBLE' && (
              <Alert variant="warning" title="You May Not Qualify">
                <div className="space-y-3">
                  <p>Based on your answers, one or more eligibility criteria were not met.</p>
                  {evaluation.unmatchedRules.length > 0 && (
                    <div className="space-y-1.5 pt-1">
                      <p className="text-xs font-bold uppercase tracking-wider text-civic-amber font-heading">
                        Reason Details:
                      </p>
                      <ul className="space-y-1 text-xs">
                        {evaluation.unmatchedRules.map((ur) => (
                          <li key={ur.ruleId} className="flex items-start gap-2">
                            <span className="text-civic-amber font-bold">•</span>
                            <span>
                              {ur.explanation}: {ur.reason ?? 'Condition not satisfied.'}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Alert>
            )}

            {evaluation.result === 'INCOMPLETE_INFO' && (
              <Alert variant="info" title="More Information Needed">
                <div className="space-y-2">
                  <p>
                    Please provide answers to the highlighted questions above to complete the
                    eligibility check.
                  </p>
                  {evaluation.missingFields.length > 0 && (
                    <p className="text-xs">
                      Missing answers needed: <strong>{evaluation.missingFields.join(', ')}</strong>
                    </p>
                  )}
                </div>
              </Alert>
            )}

            <p className="text-xs text-civic-muted italic pt-2">
              * {OFFICIAL_ELIGIBILITY_DISCLAIMER}
            </p>
          </div>
        )}
      </Card>
    </section>
  );
}
