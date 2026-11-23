import Link from 'next/link';
import { FamilyScanner } from '@/components/FamilyScanner';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { getWebEnv } from '@/lib/env';
import { Breadcrumb, Header, Heading, Paragraph, SkipLink, TrustNotice } from '@janasahayak/ui';

export default function FamilyPage() {
  const env = getWebEnv();

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
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Life Events
        </Link>
        <Link
          href="/family"
          className="text-sm font-semibold text-civic-navy underline px-3 py-1.5 rounded transition-colors"
        >
          Family Mode
        </Link>
        <LanguageSwitcher compact />
      </Header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Family Mode', href: '/family', current: true },
          ]}
        />

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
            Household Entitlement Scanner
          </p>
          <Heading as="h1" size="h1" className="text-civic-navy">
            Family Mode Guidance
          </Heading>
          <Paragraph size="large" className="text-civic-charcoal">
            Find and plan government schemes for your entire family in one place. Discover
            scholarships for college children, maternal assistance for mothers, and pension
            entitlements for elderly parents without filling separate paperwork repeatedly.
          </Paragraph>
        </div>

        {/* Interactive Family Scanner */}
        <FamilyScanner />

        <TrustNotice />
      </main>
    </div>
  );
}
