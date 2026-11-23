'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Button, Card, Header, Heading, Paragraph, SkipLink } from '@janasahayak/ui';

export default function OfflinePage() {
  const [retrying, setRetrying] = useState(false);

  const handleRetry = () => {
    setRetrying(true);
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen bg-civic-ivory text-civic-charcoal font-sans antialiased pb-20">
      <SkipLink targetId="main-content" />

      <Header
        brandName="JanaSahayak"
        tagline="Government services, explained simply."
        currentLanguage="EN"
      >
        <Link
          href="/"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Home
        </Link>
        <Link
          href="/services"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          All Services
        </Link>
      </Header>

      <main
        id="main-content"
        className="max-w-2xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-8 text-center"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 border border-amber-300 text-amber-900 mx-auto">
          {/* Offline / Disconnected Icon */}
          <svg
            className="w-8 h-8"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 4.243a9 9 0 01-2.828-2.828m0 0L3 21m2.636-15.364a9 9 0 0112.728 0M3 3l18 18"
            />
          </svg>
        </div>

        <div className="space-y-3">
          <Heading as="h1" size="h1" className="text-civic-navy">
            You are currently offline
          </Heading>
          <Paragraph size="large" className="text-civic-charcoal max-w-xl mx-auto">
            Showing recently saved information. Some live verification details and updates will
            refresh automatically as soon as you reconnect to the internet.
          </Paragraph>
        </div>

        <Card variant="bordered" className="p-6 bg-white text-left space-y-4 shadow-civic">
          <Heading as="h2" size="h3" className="text-civic-navy">
            What you can still do offline:
          </Heading>
          <ul className="space-y-3 text-sm text-civic-charcoal" role="list">
            <li className="flex items-start gap-2.5">
              <span className="text-civic-green font-bold shrink-0 text-base" aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Continue tracked application journeys:</strong> Steps and progress you’ve
                saved remain preserved in your browser.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-civic-green font-bold shrink-0 text-base" aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Review document checklists:</strong> Guides and requirements you previously
                opened are stored in your device cache.
              </span>
            </li>
            <li className="flex items-start gap-2.5">
              <span className="text-civic-green font-bold shrink-0 text-base" aria-hidden="true">
                ✓
              </span>
              <span>
                <strong>Check eligibility questions:</strong> Pre-loaded deterministic
                questionnaires evaluate without needing an active server connection.
              </span>
            </li>
          </ul>
        </Card>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleRetry}
            disabled={retrying}
            className="w-full sm:w-auto min-h-[44px]"
          >
            {retrying ? 'Testing Connection...' : 'Retry Connection'}
          </Button>
          <Link
            href="/services"
            className="inline-flex items-center justify-center px-5 py-2.5 rounded-md border border-civic-border bg-white text-civic-navy font-heading font-medium text-base hover:bg-civic-surface transition-colors w-full sm:w-auto min-h-[44px]"
          >
            Browse Saved Services
          </Link>
        </div>
      </main>
    </div>
  );
}
