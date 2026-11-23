'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { DocumentRecord } from '@janasahayak/types';
import { Card, Heading, Text } from '@janasahayak/ui';

export interface DocumentChecklistProps {
  documents: DocumentRecord[];
  serviceSlug: string;
  serviceTitle: string;
}

export function DocumentChecklist({
  documents,
  serviceSlug,
  serviceTitle,
}: DocumentChecklistProps) {
  // Store status: 'HAVE' | 'MISSING'
  const [docStatuses, setDocStatuses] = useState<Record<string, 'HAVE' | 'MISSING'>>(() => {
    const initial: Record<string, 'HAVE' | 'MISSING'> = {};
    for (const doc of documents) {
      initial[doc.id] = 'HAVE';
    }
    return initial;
  });

  const total = documents.length;
  const readyCount = Object.values(docStatuses).filter((s) => s === 'HAVE').length;
  const missingCount = total - readyCount;
  const percentage = total > 0 ? Math.round((readyCount / total) * 100) : 0;

  const handleToggle = (id: string, status: 'HAVE' | 'MISSING') => {
    setDocStatuses((prev) => ({ ...prev, [id]: status }));
  };

  return (
    <section aria-labelledby="documents-heading" className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Heading as="h2" size="h2" id="documents-heading" className="text-civic-navy">
            Required Documents Checklist
          </Heading>
          <Text size="small" className="text-civic-muted">
            Mark which documents you currently have. If you are missing any, we provide step-by-step
            guidance on how to obtain them from official departments.
          </Text>
        </div>

        {/* Readiness Meter */}
        <div className="bg-white border border-civic-border rounded-lg p-3 sm:text-right shrink-0 shadow-sm min-w-[180px]">
          <div className="text-xs font-bold uppercase tracking-wider text-civic-navy font-heading">
            Document Readiness
          </div>
          <div className="text-lg font-bold font-heading text-civic-navy">
            {readyCount} of {total} Ready
          </div>
          <div className="w-full bg-civic-surface rounded-full h-2 mt-1.5 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                readyCount === total ? 'bg-civic-green' : 'bg-civic-amber'
              }`}
              style={{ width: `${percentage}%` }}
              role="progressbar"
              aria-valuenow={readyCount}
              aria-valuemin={0}
              aria-valuemax={total}
              aria-label="Document preparation progress"
            />
          </div>
          <div className="sr-only" role="status" aria-live="polite">
            {readyCount} of {total} documents ready ({percentage}% complete).
          </div>
        </div>
      </div>

      {missingCount > 0 && (
        <div
          role="status"
          className="rounded-lg border border-civic-amber/40 bg-civic-amber/10 p-4 text-sm text-civic-charcoal flex items-start gap-3"
        >
          <span className="text-civic-amber font-bold text-lg select-none">ℹ</span>
          <div className="space-y-1">
            <p className="font-heading font-bold text-civic-navy">
              You marked {missingCount} {missingCount === 1 ? 'document' : 'documents'} as missing
            </p>
            <p className="text-xs text-civic-charcoal">
              Don&apos;t worry. Click <strong>&ldquo;How to get this document &rarr;&rdquo;</strong>{' '}
              below to see the official issuing department, requirements, fees, and steps to obtain
              it.
            </p>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {documents.map((doc, idx) => {
          const status = docStatuses[doc.id] ?? 'HAVE';
          const isMissing = status === 'MISSING';

          return (
            <Card
              key={doc.id}
              variant={isMissing ? 'bordered' : 'default'}
              className={`p-5 space-y-4 transition-colors ${
                isMissing ? 'border-civic-amber/60 bg-white' : 'bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full bg-civic-navy/10 text-civic-navy text-xs font-bold flex items-center justify-center font-heading shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div>
                    <h3 className="font-heading font-bold text-base text-civic-navy">{doc.name}</h3>
                    <p className="text-xs text-civic-charcoal mt-0.5 leading-relaxed">
                      {doc.description}
                    </p>
                  </div>
                </div>

                {/* Status Toggle Buttons */}
                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 pt-2 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => handleToggle(doc.id, 'HAVE')}
                    aria-pressed={!isMissing}
                    aria-label={`Mark ${doc.name} as I have this document`}
                    className={`text-xs font-heading font-semibold px-3.5 py-2 rounded-md transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy ${
                      !isMissing
                        ? 'bg-civic-green text-white shadow-sm'
                        : 'bg-civic-surface text-civic-charcoal hover:bg-civic-border/40'
                    }`}
                  >
                    ✓ I have this
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggle(doc.id, 'MISSING')}
                    aria-pressed={isMissing}
                    aria-label={`Mark ${doc.name} as missing document`}
                    className={`text-xs font-heading font-semibold px-3.5 py-2 rounded-md transition-colors min-h-[44px] min-w-[44px] inline-flex items-center justify-center focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy ${
                      isMissing
                        ? 'bg-civic-amber text-white shadow-sm'
                        : 'bg-civic-surface text-civic-charcoal hover:bg-civic-border/40'
                    }`}
                  >
                    Missing / Need this
                  </button>
                </div>
              </div>

              {/* Missing Guidance Box */}
              {isMissing && (
                <div className="border-t border-civic-border/60 pt-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-civic-surface/40 -mx-5 -mb-5 p-4 rounded-b-lg">
                  <div className="text-xs text-civic-charcoal space-y-0.5">
                    <p className="font-bold text-civic-navy font-heading">
                      Need help getting your {doc.name}?
                    </p>
                    <p className="text-civic-muted">
                      Check issuing department, fees, and required prerequisites.
                    </p>
                  </div>
                  <Link
                    href={`/documents/${doc.id}?returnTo=/services/${serviceSlug}&returnTitle=${encodeURIComponent(
                      serviceTitle,
                    )}`}
                    className="inline-flex items-center gap-1 text-xs font-bold text-civic-navy bg-white border border-civic-border px-3 py-1.5 rounded hover:bg-civic-navy hover:text-white transition-colors shadow-sm min-h-[36px]"
                  >
                    <span>How to get this document &rarr;</span>
                  </Link>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}
