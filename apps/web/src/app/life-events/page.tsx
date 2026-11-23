import Link from 'next/link';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { LifeEventNavigator } from '@/components/LifeEventNavigator';
import { fetchLifeEvents } from '@/lib/catalogue';
import { getWebEnv } from '@/lib/env';
import type { SupportedLanguage } from '@janasahayak/types';
import { Breadcrumb, Header, Heading, Paragraph, SkipLink, TrustNotice } from '@janasahayak/ui';

interface LifeEventsPageProps {
  searchParams?: Promise<{
    lang?: string;
  }>;
}

export default async function LifeEventsPage({ searchParams }: LifeEventsPageProps) {
  const env = getWebEnv();
  const { lang: queryLang } = (await searchParams) ?? {};

  const activeLanguage: SupportedLanguage =
    queryLang === 'hi' || queryLang === 'kn' ? queryLang : 'en';

  const events = await fetchLifeEvents();

  return (
    <div className="min-h-screen bg-civic-ivory text-civic-charcoal font-sans antialiased pb-20">
      <SkipLink targetId="main-content" />

      <Header
        brandName={env.NEXT_PUBLIC_APP_NAME}
        tagline="Government services, explained simply."
        currentLanguage={activeLanguage.toUpperCase()}
      >
        <Link
          href="/services"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          All Services
        </Link>
        <Link
          href="/deadlines"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
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
          className="text-sm font-semibold text-civic-navy underline px-3 py-1.5 rounded transition-colors"
        >
          Life Events
        </Link>
        <Link
          href="/family"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Family Mode
        </Link>
        <LanguageSwitcher currentLanguage={activeLanguage} compact />
      </Header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Life Events', href: '/life-events', current: true },
          ]}
        />

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
            Milestone Navigation
          </p>
          <Heading as="h1" size="h1" className="text-civic-navy">
            Life-Event Guidance Bundles
          </Heading>
          <Paragraph size="large" className="text-civic-charcoal">
            Citizens often need multiple government services at the same milestone — such as when
            entering college, welcoming a newborn, seeking livelihood opportunities, or reaching
            retirement. These curated bundles bring together scholarships, certificates, and
            allowances in their natural chronological sequence.
          </Paragraph>
        </div>

        {/* Life-Event Navigator Component */}
        <LifeEventNavigator events={events} activeLanguage={activeLanguage} />

        <TrustNotice />
      </main>
    </div>
  );
}
