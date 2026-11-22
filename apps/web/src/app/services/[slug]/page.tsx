import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AIAssistant } from '@/components/AIAssistant';
import { DocumentChecklist } from '@/components/DocumentChecklist';
import { EligibilityChecker } from '@/components/EligibilityChecker';
import { JourneyStepper } from '@/components/JourneyStepper';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { fetchEligibilityQuestions, fetchPublishedServiceBySlug } from '@/lib/catalogue';
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
  Text,
  TrustNotice,
  VerificationBadge,
} from '@janasahayak/ui';

interface ServiceDetailPageProps {
  params: Promise<{
    slug: string;
  }>;
  searchParams?: Promise<{
    lang?: string;
  }>;
}

export default async function ServiceDetailPage({ params, searchParams }: ServiceDetailPageProps) {
  const env = getWebEnv();
  const { slug } = await params;
  const { lang: queryLang } = (await searchParams) ?? {};

  const activeLanguage: SupportedLanguage =
    queryLang === 'hi' || queryLang === 'kn' ? queryLang : 'en';

  const detail = await fetchPublishedServiceBySlug(slug, activeLanguage);

  if (!detail) {
    notFound();
  }

  const { service, version, sources, documents, rules, journey, deadlines } = detail;
  const primarySource = sources[0];
  const questions = await fetchEligibilityQuestions(slug);

  const displayTitle =
    (typeof version?.content?.title === 'string' ? version.content.title : null) ?? service.title;
  const displayShortDesc =
    (typeof version?.content?.overview === 'string' ? version.content.overview : null) ??
    service.shortDescription;

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
          href="/design-system"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Design System
        </Link>
        <LanguageSwitcher currentLanguage={activeLanguage} compact />
      </Header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: displayTitle, href: `/services/${service.slug}`, current: true },
          ]}
        />

        {/* Service Header */}
        <div className="space-y-4 border-b border-civic-border pb-8">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
              {service.departmentName}
            </span>
            {service.stateCode && (
              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-civic-navy/10 text-civic-navy font-mono">
                {service.stateCode}
              </span>
            )}
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-civic-border/50 text-civic-charcoal uppercase">
              {service.serviceType}
            </span>
          </div>

          <Heading as="h1" size="h1" className="text-civic-navy">
            {displayTitle}
          </Heading>

          <Paragraph size="large" className="text-civic-charcoal">
            {displayShortDesc}
          </Paragraph>

          <div className="flex items-center gap-3 pt-2">
            <VerificationBadge
              status={primarySource?.verificationStatus ?? 'UNVERIFIED'}
              lastVerifiedAt={
                primarySource?.lastVerifiedAt
                  ? new Date(primarySource.lastVerifiedAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })
                  : undefined
              }
            />
          </div>
        </div>

        {/* Overview Section */}
        {version?.content && (
          <section aria-labelledby="overview-heading" className="space-y-4">
            <Heading as="h2" size="h2" id="overview-heading" className="text-civic-navy">
              Overview & Benefits
            </Heading>

            <Card variant="default" className="p-6 space-y-4">
              {typeof version.content.overview === 'string' && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-civic-navy mb-1 font-heading">
                    What is this service?
                  </h3>
                  <p className="text-sm text-civic-charcoal leading-relaxed">
                    {version.content.overview}
                  </p>
                </div>
              )}

              {typeof version.content.benefits === 'string' && (
                <div className="border-t border-civic-border/60 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-civic-navy mb-1 font-heading">
                    Key Citizen Benefits
                  </h3>
                  <p className="text-sm text-civic-charcoal leading-relaxed">
                    {version.content.benefits}
                  </p>
                </div>
              )}

              {typeof version.content.authorityContact === 'string' && (
                <div className="border-t border-civic-border/60 pt-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-civic-navy mb-1 font-heading">
                    Official Department Contact
                  </h3>
                  <p className="text-sm font-semibold text-civic-charcoal font-mono">
                    {version.content.authorityContact}
                  </p>
                </div>
              )}
            </Card>
          </section>
        )}

        {/* Who May Qualify (Eligibility Criteria) */}
        {rules.length > 0 && (
          <section aria-labelledby="eligibility-heading" className="space-y-4">
            <Heading as="h2" size="h2" id="eligibility-heading" className="text-civic-navy">
              Who May Qualify
            </Heading>

            <div className="space-y-3">
              {rules.map((rule) => (
                <Card key={rule.id} variant="bordered" className="p-4 space-y-1">
                  <p className="font-heading font-bold text-sm text-civic-navy">{rule.name}</p>
                  <p className="text-sm text-civic-charcoal">
                    {rule.explanation['en'] ?? 'Verified criteria requirement.'}
                  </p>
                  {rule.explanation['kn'] && (
                    <p className="text-xs text-civic-muted font-sans mt-1">
                      {rule.explanation['kn']}
                    </p>
                  )}
                </Card>
              ))}
            </div>

            <Text size="small" className="text-civic-muted block">
              * Note: Criteria shown above are extracted from official scheme guidelines. Official
              scrutiny takes place when documents are submitted on the government portal.
            </Text>
          </section>
        )}

        {/* Grounded Civic AI Assistant */}
        <AIAssistant
          serviceSlug={service.slug}
          serviceId={service.id}
          serviceTitle={displayTitle}
          currentLanguage={activeLanguage}
        />

        {/* Interactive Eligibility Evaluation */}
        {questions.length > 0 && (
          <EligibilityChecker
            serviceId={service.id}
            serviceTitle={service.title}
            rules={rules}
            questions={questions}
            language={activeLanguage}
          />
        )}

        {/* Interactive Required Documents Checklist & Missing Guidance */}
        {documents.length > 0 && (
          <DocumentChecklist
            documents={documents}
            serviceSlug={service.slug}
            serviceTitle={service.title}
          />
        )}

        {/* Step-by-Step Application Journey Engine */}
        {journey && journey.steps.length > 0 && (
          <section aria-labelledby="journey-heading" className="space-y-4">
            <div className="space-y-1">
              <Heading as="h2" size="h2" id="journey-heading" className="text-civic-navy">
                Step-by-Step Application Journey
              </Heading>
              <Text size="small" className="text-civic-muted">
                {journey.description}
              </Text>
            </div>

            <JourneyStepper service={detail} language={activeLanguage} />
          </section>
        )}

        {/* Deadlines if any */}
        {deadlines.length > 0 && (
          <section aria-labelledby="deadlines-heading" className="space-y-4">
            <Heading as="h2" size="h2" id="deadlines-heading" className="text-civic-navy">
              Application Deadlines
            </Heading>
            <div className="space-y-3">
              {deadlines.map((dl) => (
                <Card
                  key={dl.id}
                  variant="bordered"
                  className="p-4 flex justify-between items-center"
                >
                  <div>
                    <p className="font-heading font-bold text-sm text-civic-navy">{dl.name}</p>
                    <p className="text-xs text-civic-muted">
                      Closes on:{' '}
                      {dl.closesAt
                        ? new Date(dl.closesAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })
                        : 'Open'}
                    </p>
                  </div>
                  <span className="px-2.5 py-1 rounded text-xs font-bold uppercase bg-civic-amber/10 text-civic-amber border border-civic-amber/20">
                    {dl.status}
                  </span>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Official Application Portal & Provenance */}
        {primarySource && (
          <section aria-labelledby="official-route-heading" className="space-y-4">
            <Heading as="h2" size="h2" id="official-route-heading" className="text-civic-navy">
              Official Application Portal & Provenance
            </Heading>

            <Card variant="bordered" className="p-6 space-y-4 bg-white border-civic-navy/30">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-civic-green inline-block"></span>
                  <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                    Verified Official Government Link
                  </span>
                </div>
                <h3 className="font-heading font-bold text-lg text-civic-navy">
                  {primarySource.publisher}
                </h3>
                <p className="text-xs text-civic-muted font-mono break-all">
                  {primarySource.sourceUrl}
                </p>
              </div>

              <div className="pt-2">
                <a
                  href={primarySource.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-heading font-medium text-base px-5 py-2.5 rounded-md bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] shadow-sm"
                >
                  Visit Official Government Portal ↗
                </a>
              </div>

              <div className="border-t border-civic-border pt-4 text-xs text-civic-muted space-y-1">
                <p>
                  <strong>Provenance notice:</strong> This link points to the authoritative official
                  service portal. JanaSahayak is an informational guidance layer and does not
                  process applications or charge fees.
                </p>
                <p>
                  Last verified date:{' '}
                  {new Date(primarySource.lastVerifiedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </p>
              </div>
            </Card>
          </section>
        )}

        {/* Citizen Safety Notice */}
        <section aria-label="Citizen Safety Notice">
          <Alert variant="warning" title="Anti-Fraud & Privacy Advisory">
            Never pay any fee for information on JanaSahayak. Do not share your bank account
            passwords, Aadhaar OTPs, or debit card PINs on any unverified website or with any agent
            claiming to represent government schemes.
          </Alert>
        </section>

        {/* Trust Notice */}
        <TrustNotice />
      </main>
    </div>
  );
}
