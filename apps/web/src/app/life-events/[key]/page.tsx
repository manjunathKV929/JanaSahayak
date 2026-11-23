import Link from 'next/link';
import { notFound } from 'next/navigation';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { TextToSpeechReader } from '@/components/TextToSpeechReader';
import { fetchLifeEventByKey } from '@/lib/catalogue';
import { getWebEnv } from '@/lib/env';
import type { SupportedLanguage } from '@janasahayak/types';
import {
  Alert,
  Breadcrumb,
  Card,
  Header,
  Heading,
  Paragraph,
  SkipLink,
  TrustNotice,
} from '@janasahayak/ui';

interface LifeEventDetailPageProps {
  params: Promise<{
    key: string;
  }>;
  searchParams?: Promise<{
    lang?: string;
  }>;
}

export default async function LifeEventDetailPage({
  params,
  searchParams,
}: LifeEventDetailPageProps) {
  const env = getWebEnv();
  const { key } = await params;
  const { lang: queryLang } = (await searchParams) ?? {};

  const activeLanguage: SupportedLanguage =
    queryLang === 'hi' || queryLang === 'kn' ? queryLang : 'en';

  const event = await fetchLifeEventByKey(key);

  if (!event) {
    notFound();
  }

  const displayTitle = event.title[activeLanguage] ?? event.title['en'] ?? 'Life Event';
  const displayDesc = event.description[activeLanguage] ?? event.description['en'] ?? '';

  // Consolidate all required documents across bundled schemes
  const allDocuments = Array.from(
    new Set(event.serviceBundles.flatMap((b) => b.requiredDocuments)),
  );

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
          href="/life-events"
          className="text-sm font-semibold text-civic-navy underline px-3 py-1.5 rounded transition-colors"
        >
          Life Events
        </Link>
        <LanguageSwitcher currentLanguage={activeLanguage} compact />
      </Header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Life Events', href: '/life-events' },
            { label: displayTitle, href: `/life-events/${key}`, current: true },
          ]}
        />

        {/* Milestone Header */}
        <div className="space-y-3 border-b border-civic-border pb-6">
          <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
            Milestone Checklist Bundle
          </span>
          <Heading as="h1" size="h1" className="text-civic-navy">
            {displayTitle}
          </Heading>
          {activeLanguage !== 'en' && (
            <p className="text-xs font-heading text-civic-muted">{event.title['en']}</p>
          )}
          <Paragraph size="large" className="text-civic-charcoal">
            {displayDesc}
          </Paragraph>

          <div className="pt-2">
            <TextToSpeechReader
              text={`${displayTitle}. ${displayDesc}`}
              language={activeLanguage}
              label="Listen to Overview"
            />
          </div>
        </div>

        {/* Combined Essential Documents Checklist */}
        {allDocuments.length > 0 && (
          <section aria-labelledby="docs-bundle-heading" className="space-y-4">
            <h2 id="docs-bundle-heading" className="font-heading font-bold text-lg text-civic-navy">
              Consolidated Document Checklist
            </h2>
            <Card variant="bordered" className="p-5 bg-white border-civic-border space-y-3">
              <p className="text-xs text-civic-muted">
                Prepare these authoritative documents to cover all schemes bundled in this
                milestone:
              </p>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-civic-charcoal font-medium">
                {allDocuments.map((doc, idx) => (
                  <li
                    key={idx}
                    className="flex items-center gap-2 p-2 bg-civic-ivory/60 rounded border border-civic-border/50"
                  >
                    <span className="w-2 h-2 rounded-full bg-civic-green"></span>
                    <span>{doc}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        {/* Chronological Service Guide */}
        <section aria-labelledby="steps-bundle-heading" className="space-y-4">
          <h2 id="steps-bundle-heading" className="font-heading font-bold text-lg text-civic-navy">
            Recommended Chronological Action Steps
          </h2>

          <div className="space-y-4">
            {event.serviceBundles.map((bundle, index) => (
              <Card
                key={bundle.serviceId}
                variant="bordered"
                className="p-5 bg-white border-civic-border space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-civic-navy bg-civic-ivory px-2 py-0.5 rounded border border-civic-border">
                        Action {index + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          bundle.importance === 'CRITICAL'
                            ? 'bg-amber-100 text-amber-900 border border-amber-300'
                            : 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                        }`}
                      >
                        {bundle.importance} Priority
                      </span>
                    </div>
                    <h3 className="font-heading font-bold text-base text-civic-navy pt-1">
                      {bundle.title}
                    </h3>
                  </div>

                  <Link
                    href={`/services/${bundle.slug}`}
                    className="inline-flex items-center text-xs font-bold text-civic-navy hover:underline min-h-[44px]"
                  >
                    Start Service Application →
                  </Link>
                </div>

                <div className="text-xs bg-civic-ivory/50 p-2.5 rounded border border-civic-border/70 flex items-center gap-2">
                  <span className="font-bold text-civic-green font-heading uppercase text-[10px]">
                    Timeline Advice:
                  </span>
                  <span className="text-civic-charcoal font-medium">{bundle.typicalTimeline}</span>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Safety Note */}
        <Alert variant="warning" title="Civic Safety Notice">
          Never share original documents or Aadhaar OTPs with unauthorized intermediaries.
          Government schemes are administered directly by respective department officers.
        </Alert>

        <TrustNotice />
      </main>
    </div>
  );
}
