'use client';

import React, { useState } from 'react';
import type { AIAssistResult, SupportedLanguage, VerificationStatus } from '@janasahayak/types';
import { Alert, Button, Card, Heading, Text, VerificationBadge } from '@janasahayak/ui';
import { askAIAssistant } from '@/lib/catalogue';

export interface AIAssistantProps {
  serviceSlug?: string;
  serviceId?: string;
  serviceTitle?: string;
  currentLanguage?: SupportedLanguage;
}

const DEFAULT_SUGGESTED_QUESTIONS: Record<SupportedLanguage, string[]> = {
  en: [
    'What are the eligibility criteria?',
    'Which documents do I need?',
    'What is the official application website?',
  ],
  hi: ['पात्रता मानदंड क्या हैं?', 'मुझे कौन से दस्तावेज़ चाहिए?', 'आधिकारिक आवेदन वेबसाइट कौन सी है?'],
  kn: ['ಅರ್ಹತಾ ಮಾನದಂಡಗಳು ಯಾವುವು?', 'ಯಾವ ದಾಖಲೆಗಳು ಬೇಕಾಗುತ್ತವೆ?', 'ಅಧಿಕೃತ ಅರ್ಜಿ ವೆಬ್‌ಸೈಟ್ ಯಾವುದು?'],
};

export function AIAssistant({
  serviceSlug,
  serviceId,
  serviceTitle,
  currentLanguage = 'en',
}: AIAssistantProps) {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AIAssistResult | null>(null);
  const [piiWarning, setPiiWarning] = useState(false);

  const suggestedQuestions =
    DEFAULT_SUGGESTED_QUESTIONS[currentLanguage] ?? DEFAULT_SUGGESTED_QUESTIONS.en;

  async function handleAsk(questionText: string) {
    if (!questionText.trim()) return;
    setLoading(true);
    setPiiWarning(false);

    // Client-side quick check for PII warning
    const hasAadhaarOrCard = /\b\d{4}\s?\d{4}\s?\d{4}\b|[A-Z]{5}[0-9]{4}[A-Z]/.test(questionText);
    if (hasAadhaarOrCard) {
      setPiiWarning(true);
    }

    try {
      const response = await askAIAssistant(questionText, {
        language: currentLanguage,
        ...(serviceSlug ? { serviceSlug } : {}),
        ...(serviceId ? { serviceId } : {}),
      });
      setResult(response);
    } catch {
      setResult({
        answer:
          "I couldn't verify that from the available official information. Please check the official source.",
        sources: [],
        refusal: true,
        suggestedActions: ['Check official government portal'],
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleAsk(query);
  }

  return (
    <Card
      variant="default"
      className="p-6 border-2 border-civic-navy/20 bg-white space-y-6 shadow-civic"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-civic-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
              Grounded AI Guidance
            </span>
            <span className="text-xs px-2 py-0.5 rounded bg-civic-navy/10 text-civic-navy font-mono font-semibold">
              Non-Authoritative
            </span>
          </div>
          <Heading as="h3" size="h3" className="text-civic-navy mt-1">
            Ask about {serviceTitle ? `"${serviceTitle}"` : 'this service'}
          </Heading>
        </div>
      </div>

      {/* Privacy Notice */}
      <Alert variant="info" title="Privacy Protection Notice">
        <Text size="small" className="text-civic-charcoal">
          <strong>Do not enter Aadhaar, PAN, passwords, OTPs, or bank PINs.</strong> This assistant
          provides verified public guidance only and will automatically redact sensitive
          identifiers.
        </Text>
      </Alert>

      {piiWarning && (
        <Alert variant="warning" title="Sensitive Number Detected & Redacted">
          <Text size="small" className="text-civic-charcoal">
            A sensitive number pattern was detected in your message and automatically redacted
            before processing.
          </Text>
        </Alert>
      )}

      {/* Suggested Questions */}
      <div className="space-y-2">
        <Text size="small" className="font-semibold text-civic-charcoal font-heading">
          Suggested questions:
        </Text>
        <div className="flex flex-wrap gap-2">
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setQuery(q);
                handleAsk(q);
              }}
              className="text-xs px-3 py-1.5 rounded-full bg-civic-ivory border border-civic-border hover:border-civic-navy hover:bg-civic-navy/5 text-civic-navy font-medium transition-colors text-left"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* Query Form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <label htmlFor="ai-assistant-input" className="sr-only">
            Ask a question about this service
          </label>
          <input
            id="ai-assistant-input"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Type your question (e.g. What is the income limit?)"
            className="flex-1 px-4 py-2.5 rounded-md border border-civic-border bg-civic-ivory text-sm text-civic-charcoal placeholder:text-civic-muted focus:outline-none focus:border-civic-navy min-h-[44px]"
            disabled={loading}
          />
          <Button
            type="submit"
            variant="primary"
            size="md"
            disabled={loading || !query.trim()}
            className="min-h-[44px]"
          >
            {loading ? 'Consulting Official Records...' : 'Ask Assistant'}
          </Button>
        </div>
      </form>

      {/* Result Display */}
      {result && (
        <div
          role="status"
          aria-live="polite"
          className="space-y-4 pt-4 border-t border-civic-border"
        >
          <div
            className={`p-4 rounded-lg border ${
              result.refusal
                ? 'bg-amber-50/50 border-amber-300'
                : 'bg-civic-ivory/80 border-civic-border'
            }`}
          >
            <div className="flex items-center gap-2 mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-navy font-heading">
                {result.refusal ? 'Conservative Refusal' : 'Grounded Answer'}
              </span>
              {result.model && (
                <span className="text-[10px] text-civic-muted font-mono">({result.model})</span>
              )}
            </div>
            <p className="text-sm text-civic-charcoal leading-relaxed whitespace-pre-line">
              {result.answer}
            </p>
          </div>

          {/* Provenance and Citations */}
          {result.sources.length > 0 && (
            <div className="space-y-2">
              <Text size="small" className="font-semibold text-civic-navy font-heading">
                Official Sources & Provenance:
              </Text>
              <ul className="space-y-2">
                {result.sources.map((src, idx) => (
                  <li
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded border border-civic-border bg-white text-xs gap-2"
                  >
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-civic-navy">
                          {src.publisher ?? 'Official Government Portal'}
                        </span>
                        <VerificationBadge status={src.verificationStatus as VerificationStatus} />
                      </div>
                      <a
                        href={src.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-civic-green hover:underline font-mono text-[11px] break-all block"
                      >
                        {src.sourceUrl} ↗
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggested Next Steps */}
          {result.suggestedActions.length > 0 && (
            <div className="pt-2">
              <Text
                size="small"
                className="font-semibold text-civic-muted uppercase tracking-wider font-heading"
              >
                Next Steps:
              </Text>
              <div className="flex flex-wrap gap-2 mt-1">
                {result.suggestedActions.map((action, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center text-xs px-2.5 py-1 rounded bg-civic-navy/5 text-civic-navy font-medium"
                  >
                    • {action}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Legal Non-Authority Disclaimer */}
          <div className="p-3 bg-civic-ivory/50 rounded border border-civic-border text-[11px] text-civic-muted leading-relaxed">
            <strong>Disclaimer:</strong> JanaSahayak is an explanatory guidance layer and is not an
            official government authority. Output is bounded by verified public records. For
            official submissions, applications, or binding legal decisions, always refer to the
            official government portal.
          </div>
        </div>
      )}
    </Card>
  );
}
