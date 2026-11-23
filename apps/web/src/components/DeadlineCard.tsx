'use client';

import React from 'react';
import Link from 'next/link';
import type { DeadlineSummary } from '@janasahayak/types';
import { Card } from '@janasahayak/ui';
import { TextToSpeechReader } from './TextToSpeechReader';

interface DeadlineCardProps {
  deadline: DeadlineSummary;
  className?: string;
}

export function DeadlineCard({ deadline, className = '' }: DeadlineCardProps) {
  const isClosingSoon = deadline.status === 'CLOSING_SOON';
  const isExpired = deadline.status === 'EXPIRED';
  const isUpcoming = deadline.status === 'UPCOMING';

  const downloadCalendarReminder = () => {
    if (!deadline.closesAt) return;
    const start = new Date(deadline.closesAt).toISOString().replace(/-|:|\.\d+/g, '');
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//JanaSahayak//Deadlines//EN',
      'BEGIN:VEVENT',
      `UID:${deadline.id}@janasahayak.gov.in`,
      `DTSTAMP:${new Date().toISOString().replace(/-|:|\.\d+/g, '')}`,
      `DTSTART:${start}`,
      `DTEND:${start}`,
      `SUMMARY:Deadline: ${deadline.name}`,
      `DESCRIPTION:Application deadline for ${deadline.serviceTitle}. Official source: ${deadline.sourceUrl ?? ''}`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${deadline.serviceSlug}-deadline.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const formattedDate = deadline.closesAt
    ? new Date(deadline.closesAt).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : 'Ongoing scheme (No cutoff)';

  const readAloudText = `${deadline.name} for ${deadline.serviceTitle}. Closes on ${formattedDate}. Status is ${
    isExpired
      ? 'Application period ended'
      : isClosingSoon
        ? `${deadline.daysRemaining} days remaining`
        : deadline.status
  }.`;

  return (
    <Card
      variant="bordered"
      className={`p-5 space-y-4 bg-white transition-shadow hover:shadow-md ${
        isClosingSoon
          ? 'border-l-4 border-l-civic-amber border-civic-border'
          : isExpired
            ? 'border-l-4 border-l-red-500 border-civic-border/70 opacity-80'
            : 'border-civic-border'
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading">
              Application Deadline
            </span>
            {deadline.stateCode && (
              <span className="text-xs font-mono px-1.5 py-0.5 rounded bg-civic-navy/10 text-civic-navy font-semibold">
                {deadline.stateCode}
              </span>
            )}
          </div>
          <h3 className="font-heading font-bold text-base text-civic-navy">
            <Link href={`/services/${deadline.serviceSlug}`} className="hover:underline">
              {deadline.serviceTitle}
            </Link>
          </h3>
          <p className="text-sm font-semibold text-civic-charcoal">{deadline.name}</p>
        </div>

        {/* Urgency Badge */}
        <div className="flex items-center gap-2">
          {isClosingSoon && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase bg-amber-100 text-amber-900 border border-amber-300">
              <span className="w-2 h-2 rounded-full bg-amber-600 animate-ping"></span>
              {deadline.daysRemaining} days remaining
            </span>
          )}
          {isExpired && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-red-100 text-red-900 border border-red-300">
              Application period ended
            </span>
          )}
          {deadline.status === 'OPEN' && !isClosingSoon && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-900 border border-emerald-300">
              Applications open
            </span>
          )}
          {isUpcoming && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-blue-100 text-blue-900 border border-blue-200">
              Opening soon
            </span>
          )}
        </div>
      </div>

      {/* Date & Provenance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-civic-ivory/60 p-3 rounded border border-civic-border/50">
        <div>
          <span className="text-civic-muted block">Cutoff Date:</span>
          <span className="font-heading font-bold text-civic-navy text-sm">{formattedDate}</span>
        </div>
        <div>
          <span className="text-civic-muted block">Verified Authority:</span>
          <span className="font-semibold text-civic-charcoal">
            {deadline.sourcePublisher ?? 'Official Department Portal'}
          </span>
        </div>
      </div>

      {/* Action Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-1 border-t border-civic-border/60">
        <div className="flex items-center gap-2">
          {deadline.sourceUrl && (
            <a
              href={deadline.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-xs font-bold text-civic-navy hover:underline min-h-[44px] px-2"
            >
              Official notification ↗
            </a>
          )}
          <TextToSpeechReader text={readAloudText} label="Listen" />
        </div>

        {deadline.closesAt && !isExpired && (
          <button
            type="button"
            onClick={downloadCalendarReminder}
            aria-label={`Add reminder for ${deadline.name} to calendar`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] shadow-sm transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <span>Set Reminder (.ics)</span>
          </button>
        )}
      </div>
    </Card>
  );
}
