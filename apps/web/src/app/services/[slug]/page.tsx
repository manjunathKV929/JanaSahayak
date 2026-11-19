import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchPublishedServiceBySlug } from '@/lib/catalogue';
import { getWebEnv } from '@/lib/env';
import {
  Alert,
  Breadcrumb,
  Card,
  Header,
  Heading,
  NextStepCard,
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
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const env = getWebEnv();
  const { slug } = await params;
  const detail = await fetchPublishedServiceBySlug(slug);

  if (!detail) {
    notFound();
  }

  const { service, version, sources, documents, rules, journey, deadlines } = detail;
  const primarySource = sources[0];

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
          href="/design-system"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Design System
        </Link>
      </Header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: service.title, href: `/services/${service.slug}`, current: true },
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
            {service.title}
          </Heading>

          <Paragraph size="large" className="text-civic-charcoal">
            {service.shortDescription}
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

        {/* Required Documents Checklist */}
        {documents.length > 0 && (
          <section aria-labelledby="documents-heading" className="space-y-4">
            <Heading as="h2" size="h2" id="documents-heading" className="text-civic-navy">
              Required Documents Checklist
            </Heading>

            <div className="grid grid-cols-1 gap-3">
              {documents.map((doc, idx) => (
                <div
                  key={doc.id}
                  className="flex items-start gap-3 p-4 rounded-lg border border-civic-border bg-white shadow-sm"
                >
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-civic-navy/10 text-civic-navy text-xs font-bold flex items-center justify-center font-heading">
                    {idx + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="font-heading font-bold text-sm text-civic-navy">{doc.name}</p>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-civic-green/10 text-civic-green">
                        Required
                      </span>
                    </div>
                    <p className="text-xs text-civic-charcoal">{doc.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Step-by-Step Guidance */}
        {journey && journey.steps.length > 0 && (
          <section aria-labelledby="journey-heading" className="space-y-4">
            <div className="space-y-1">
              <Heading as="h2" size="h2" id="journey-heading" className="text-civic-navy">
                Step-by-Step Application Guide
              </Heading>
              <Text size="small" className="text-civic-muted">
                {journey.description}
              </Text>
            </div>

            <div className="space-y-4">
              {journey.steps.map((step) => (
                <NextStepCard
                  key={step.id}
                  stepNumber={step.displayOrder}
                  title={step.title}
                  description={step.description['en'] ?? ''}
                  actionLabel={step.officialUrl ? 'Open Step Link ↗' : undefined}
                  actionHref={step.officialUrl ?? undefined}
                  isOfficialRoute={Boolean(step.officialUrl)}
                />
              ))}
            </div>
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
