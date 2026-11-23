import Link from 'next/link';
import { DeadlineCard } from '@/components/DeadlineCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { fetchDeadlines } from '@/lib/catalogue';
import { getWebEnv } from '@/lib/env';
import {
  Alert,
  Breadcrumb,
  Header,
  Heading,
  Paragraph,
  SkipLink,
  TrustNotice,
} from '@janasahayak/ui';

interface DeadlinesPageProps {
  searchParams?: Promise<{
    status?: string;
    category?: string;
  }>;
}

export default async function DeadlinesPage({ searchParams }: DeadlinesPageProps) {
  const env = getWebEnv();
  const { status = 'ALL', category } = (await searchParams) ?? {};

  const deadlines = await fetchDeadlines({
    status: status !== 'ALL' ? status : undefined,
    category,
  });

  return (
    <div className="min-h-screen bg-civic-ivory text-civic-charcoal font-sans antialiased pb-20">
      <SkipLink targetId="main-content" />

      <Header
        brandName={env.NEXT_PUBLIC_APP_NAME}
        tagline="Government services, explained simply."
        currentLanguage={env.NEXT_PUBLIC_DEFAULT_LANGUAGE.toUpperCase()}
      >
        <Link
          href="/services"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          All Services
        </Link>
        <Link
          href="/deadlines"
          className="text-sm font-semibold text-civic-navy underline px-3 py-1.5 rounded transition-colors"
        >
          Deadlines
        </Link>
        <Link
          href="/locations"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Service Centers
        </Link>
        <Link
          href="/life-events"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Life Events
        </Link>
        <Link
          href="/family"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Family Mode
        </Link>
        <LanguageSwitcher compact />
      </Header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Deadlines Tracker', href: '/deadlines', current: true },
          ]}
        />

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
            Official Timeline Tracking
          </p>
          <Heading as="h1" size="h1" className="text-civic-navy">
            Application Deadlines & Renewals
          </Heading>
          <Paragraph size="large" className="text-civic-charcoal">
            Track confirmed submission cutoffs, academic application windows, and annual
            re-verification deadlines for public schemes. Deadlines are cross-verified with official
            gazettes and department portals.
          </Paragraph>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex flex-wrap gap-2 pt-2 border-b border-civic-border pb-4">
          {[
            { label: 'All Deadlines', value: 'ALL' },
            { label: 'Closing Soon (<= 15 Days)', value: 'CLOSING_SOON' },
            { label: 'Open Now', value: 'OPEN' },
            { label: 'Opening Soon', value: 'UPCOMING' },
          ].map((tab) => {
            const active = status === tab.value;
            return (
              <Link
                key={tab.value}
                href={tab.value === 'ALL' ? '/deadlines' : `/deadlines?status=${tab.value}`}
                className={`px-4 py-2 rounded-full text-xs font-heading font-semibold min-h-[44px] inline-flex items-center transition-colors ${
                  active
                    ? 'bg-civic-navy text-white shadow-sm'
                    : 'bg-white border border-civic-border text-civic-charcoal hover:bg-civic-ivory'
                }`}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>

        {/* Deadlines List */}
        {deadlines.length > 0 ? (
          <div className="space-y-4">
            {deadlines.map((deadline) => (
              <DeadlineCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-lg border border-civic-border space-y-2">
            <p className="font-heading font-bold text-civic-navy">No deadlines found</p>
            <p className="text-sm text-civic-muted">
              There are currently no active deadlines matching the selected filter.
            </p>
            <Link
              href="/deadlines"
              className="inline-block mt-3 text-sm font-semibold text-civic-navy underline min-h-[44px]"
            >
              Reset filters
            </Link>
          </div>
        )}

        {/* Safety Advisory */}
        <Alert variant="warning" title="Important Deadline Notice">
          Never pay intermediaries claiming they can extend official application deadlines. Official
          dates are determined solely by the respective government departments.
        </Alert>

        <TrustNotice />
      </main>
    </div>
  );
}
