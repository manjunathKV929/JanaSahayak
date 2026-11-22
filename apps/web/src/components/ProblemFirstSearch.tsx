'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type {
  SearchInterpretationResult,
  SupportedLanguage,
  VerificationStatus,
} from '@janasahayak/types';
import { Alert, Button, Card, Text, VerificationBadge } from '@janasahayak/ui';
import { interpretSearchQuery } from '@/lib/catalogue';

export interface ProblemFirstSearchProps {
  currentLanguage?: SupportedLanguage;
  initialQuery?: string;
}

const INTENT_LABELS: Record<string, string> = {
  SCHOLARSHIP_DISCOVERY: 'Scholarships & Student Welfare',
  DOCUMENT_GUIDANCE: 'Official Document Guide',
  SENIOR_CITIZEN_SUPPORT: 'Senior Citizen Cards & Pensions',
  ELIGIBILITY_CHECK: 'Service Eligibility Check',
  GRIEVANCE_HELP: 'Grievance & Redressal Navigation',
  GENERAL_INQUIRY: 'General Public Service Inquiry',
  OUT_OF_SCOPE: 'Out of Scope Request',
};

export function ProblemFirstSearch({
  currentLanguage = 'en',
  initialQuery = '',
}: ProblemFirstSearchProps) {
  const [query, setQuery] = useState(initialQuery);
  const [loading, setLoading] = useState(false);
  const [interpretation, setInterpretation] = useState<SearchInterpretationResult | null>(null);

  async function handleSearch(searchQuery: string) {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await interpretSearchQuery(searchQuery, currentLanguage);
      setInterpretation(result);
    } catch {
      setInterpretation(null);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    handleSearch(query);
  }

  return (
    <div className="space-y-6">
      <form
        onSubmit={handleSubmit}
        role="search"
        aria-label="Search government services"
        className="rounded-lg border-2 border-civic-navy/20 bg-white p-2 sm:p-3 shadow-civic focus-within:border-civic-navy transition-all"
      >
        <label htmlFor="problem-search-input" className="sr-only">
          What do you need help with?
        </label>
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            id="problem-search-input"
            name="q"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            placeholder="What do you need help with? (e.g. college scholarship, senior citizen card)"
            className="flex-1 px-4 py-3 text-base text-civic-charcoal placeholder:text-civic-muted focus:outline-none bg-transparent"
          />
          <Button type="submit" variant="primary" size="md" disabled={loading || !query.trim()}>
            {loading ? 'Interpreting...' : 'Search Services'}
          </Button>
        </div>
      </form>

      {/* Interpretation Results */}
      {interpretation && (
        <Card
          variant="default"
          className="p-6 border border-civic-border bg-white space-y-4 shadow-civic"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-civic-border pb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                Understood Intent
              </span>
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-civic-navy/10 text-civic-navy font-semibold font-heading">
                {INTENT_LABELS[interpretation.intent] ?? interpretation.intent}
              </span>
            </div>
            {interpretation.piiDetected && (
              <span className="text-xs px-2.5 py-0.5 rounded bg-amber-100 text-amber-800 font-medium">
                🛡️ Sensitive numbers redacted
              </span>
            )}
          </div>

          {interpretation.piiDetected && (
            <Alert variant="info" title="Privacy Note">
              <Text size="small" className="text-civic-charcoal">
                Your query contained sensitive personal identifiers (such as Aadhaar or card
                numbers) which were automatically redacted to protect your privacy.
              </Text>
            </Alert>
          )}

          {/* Suggested Clarifying Questions */}
          {interpretation.suggestedQuestions.length > 0 && (
            <div className="space-y-2">
              <Text size="small" className="font-semibold text-civic-charcoal font-heading">
                Clarifying questions:
              </Text>
              <div className="flex flex-wrap gap-2">
                {interpretation.suggestedQuestions.map((sq, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(sq);
                      handleSearch(sq);
                    }}
                    className="text-xs px-3 py-1.5 rounded-full bg-civic-ivory border border-civic-border hover:border-civic-navy hover:bg-civic-navy/5 text-civic-navy font-medium transition-colors text-left"
                  >
                    {sq}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Matched Verified Services */}
          {interpretation.matches.length > 0 ? (
            <div className="space-y-3 pt-2">
              <Text size="small" className="font-semibold text-civic-navy font-heading">
                Matching Verified Services:
              </Text>
              <div className="grid grid-cols-1 gap-3">
                {interpretation.matches.map((m) => (
                  <Link
                    key={m.id}
                    href={`/services/${m.slug}`}
                    className="block p-4 rounded-lg border border-civic-border hover:border-civic-navy bg-civic-ivory/30 transition-all group"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="text-sm font-bold text-civic-navy group-hover:underline">
                        {m.title}
                      </h4>
                      <VerificationBadge status={m.verification.status as VerificationStatus} />
                    </div>
                    <p className="text-xs text-civic-muted mt-1">{m.summary}</p>
                  </Link>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 bg-civic-ivory/50 rounded border border-civic-border text-center">
              <p className="text-sm text-civic-muted">
                No matching verified public service was found for this specific query. Please try
                browsing categories or rephrasing your search.
              </p>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}
