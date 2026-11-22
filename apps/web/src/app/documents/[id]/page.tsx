import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchDocumentById } from '@/lib/catalogue';
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
} from '@janasahayak/ui';

interface DocumentGuidePageProps {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    returnTo?: string;
    returnTitle?: string;
  }>;
}

export default async function DocumentGuidePage({ params, searchParams }: DocumentGuidePageProps) {
  const env = getWebEnv();
  const { id } = await params;
  const { returnTo, returnTitle } = await searchParams;

  const docDetail = await fetchDocumentById(id);

  if (!docDetail) {
    notFound();
  }

  const { guide, issuer } = docDetail;
  const lang = env.NEXT_PUBLIC_DEFAULT_LANGUAGE;

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

      <main id="main-content" className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Services', href: '/services' },
            { label: `Document Guide: ${docDetail.name}`, href: `/documents/${id}`, current: true },
          ]}
        />

        {/* Return-to-Service Flow Banner */}
        {returnTo && (
          <div
            role="region"
            aria-label="Return to service journey"
            className="rounded-lg border-2 border-civic-navy bg-civic-navy text-white p-5 sm:p-6 shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
          >
            <div className="space-y-1">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                Application In Progress
              </span>
              <p className="text-base font-semibold font-heading">
                You were applying for {returnTitle ? `"${returnTitle}"` : 'your public service'}.
              </p>
              <p className="text-xs text-white/80">
                Once you complete your document request or receive your application acknowledgment
                number, click below to return to your application.
              </p>
            </div>
            <Link
              href={returnTo}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-civic-green text-white font-heading font-semibold text-sm rounded hover:bg-[#2e5746] transition-colors shrink-0 shadow-sm min-h-[44px]"
            >
              <span>&larr; Return to Application</span>
            </Link>
          </div>
        )}

        {/* Page Header */}
        <div className="space-y-3 border-b border-civic-border pb-6">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center px-2.5 py-0.5 rounded text-xs font-bold uppercase bg-civic-navy/10 text-civic-navy font-heading">
              Official Document Guide
            </span>
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-civic-border/50 text-civic-charcoal uppercase">
              {docDetail.documentType}
            </span>
          </div>

          <Heading as="h1" size="h1" className="text-civic-navy">
            {docDetail.name}
          </Heading>

          <Paragraph size="large" className="text-civic-charcoal max-w-3xl">
            {docDetail.description}
          </Paragraph>
        </div>

        {/* Core Question 1 & 2: Purpose & Why Needed */}
        <section aria-labelledby="purpose-heading" className="space-y-3">
          <Heading as="h2" size="h2" id="purpose-heading" className="text-civic-navy">
            What is this document and why is it required?
          </Heading>
          <Card variant="default" className="p-6 bg-white space-y-3">
            <p className="text-sm text-civic-charcoal leading-relaxed">
              {guide.purpose[lang] ?? guide.purpose['en'] ?? docDetail.description}
            </p>
            {guide.purpose['kn'] && lang !== 'kn' && (
              <p className="text-xs text-civic-muted border-t border-civic-border/60 pt-2 font-sans">
                {guide.purpose['kn']}
              </p>
            )}
          </Card>
        </section>

        {/* Core Question 3: Where can I get it? (Official Issuing Authority) */}
        <section aria-labelledby="authority-heading" className="space-y-3">
          <Heading as="h2" size="h2" id="authority-heading" className="text-civic-navy">
            Where to obtain this document
          </Heading>
          <Card variant="bordered" className="p-6 bg-white space-y-4 border-civic-navy/30">
            <div className="space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                Official Designated Authority
              </span>
              <h3 className="font-heading font-bold text-lg text-civic-navy">
                {guide.issuingAuthority.name || issuer?.name || 'Competent Authority'}
              </h3>
              <p className="text-xs text-civic-charcoal font-medium">
                Department: {guide.issuingAuthority.department}
              </p>
              <p className="text-xs text-civic-muted">
                Offices / Service Counters: {guide.issuingAuthority.physicalOffices}
              </p>
              {guide.issuingAuthority.helpline && (
                <p className="text-xs text-civic-charcoal font-mono">
                  Helpline: {guide.issuingAuthority.helpline}
                </p>
              )}
            </div>

            {guide.issuingAuthority.portalUrl && (
              <div className="pt-2 border-t border-civic-border/60">
                <a
                  href={guide.issuingAuthority.portalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center font-heading font-medium text-sm px-5 py-2.5 rounded-md bg-civic-navy text-white hover:bg-civic-navy-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-civic-navy min-h-[44px] shadow-sm"
                >
                  Visit Official Issuing Portal ↗
                </a>
              </div>
            )}
          </Card>
        </section>

        {/* Core Question 4: Prerequisites Checklist */}
        {guide.prerequisites.length > 0 && (
          <section aria-labelledby="prereq-heading" className="space-y-3">
            <Heading as="h2" size="h2" id="prereq-heading" className="text-civic-navy">
              What documents will you need to apply?
            </Heading>
            <div className="grid grid-cols-1 gap-3">
              {guide.prerequisites.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-4 rounded-lg border border-civic-border bg-white shadow-sm"
                >
                  <span className="w-6 h-6 rounded-full bg-civic-navy/10 text-civic-navy text-xs font-bold flex items-center justify-center font-heading shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="space-y-1">
                    <p className="font-heading font-bold text-sm text-civic-navy">{req.name}</p>
                    <p className="text-xs text-civic-charcoal">
                      {req.description[lang] ?? req.description['en']}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Core Question 5: Timeline & Fees Grid */}
        <section aria-labelledby="timeline-heading" className="space-y-3">
          <Heading as="h2" size="h2" id="timeline-heading" className="text-civic-navy">
            Processing Time, Fees & Validity
          </Heading>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card variant="default" className="p-4 space-y-1 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading">
                Estimated Processing Time
              </span>
              <p className="text-xl font-bold font-heading text-civic-navy">
                {guide.processingTimeDays} Days
              </p>
              <p className="text-xs text-civic-muted">Statutory service delivery window.</p>
            </Card>

            <Card variant="default" className="p-4 space-y-1 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading">
                Official Fee
              </span>
              <p className="text-sm font-bold font-heading text-civic-navy">
                {guide.fees[lang] ?? guide.fees['en']}
              </p>
              <p className="text-xs text-civic-muted">Standard government tariff.</p>
            </Card>

            <Card variant="default" className="p-4 space-y-1 bg-white">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading">
                Certificate Validity
              </span>
              <p className="text-sm font-bold font-heading text-civic-navy">
                {guide.validityPeriod[lang] ?? guide.validityPeriod['en']}
              </p>
              <p className="text-xs text-civic-muted">Validity from issue date.</p>
            </Card>
          </div>
        </section>

        {/* Core Question 6: Step-by-Step Issuing Guide */}
        {guide.steps.length > 0 && (
          <section aria-labelledby="steps-heading" className="space-y-4">
            <div className="space-y-1">
              <Heading as="h2" size="h2" id="steps-heading" className="text-civic-navy">
                Step-by-Step Issuing Guide
              </Heading>
              <Text size="small" className="text-civic-muted">
                Follow these ordered actions to obtain your official certificate.
              </Text>
            </div>

            <div className="space-y-4">
              {guide.steps.map((step) => (
                <NextStepCard
                  key={step.stepNumber}
                  stepNumber={step.stepNumber}
                  title={step.title}
                  description={step.description[lang] ?? step.description['en'] ?? ''}
                  actionLabel={step.officialUrl ? 'Open Official Portal ↗' : undefined}
                  actionHref={step.officialUrl ?? undefined}
                  isOfficialRoute={Boolean(step.officialUrl)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Bottom Return CTA (if returnTo present) */}
        {returnTo && (
          <div className="border-t border-civic-border pt-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-heading font-bold text-base text-civic-navy">
                Ready to continue your application?
              </p>
              <p className="text-xs text-civic-muted">
                Return to your {returnTitle ? `"${returnTitle}"` : 'service'} application once you
                have submitted this document request.
              </p>
            </div>
            <Link
              href={returnTo}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-civic-navy text-white font-heading font-semibold text-sm rounded hover:bg-civic-navy-dark transition-colors shadow-sm min-h-[44px]"
            >
              <span>&larr; Return to Application</span>
            </Link>
          </div>
        )}

        {/* Citizen Safety Notice */}
        <section aria-label="Citizen Anti-Fraud Notice">
          <Alert variant="warning" title="Anti-Fraud & Privacy Advisory">
            Government certificates are issued strictly through designated official portals (such as
            Nadakacheri / Seva Sindhu) or authorized citizen counters (Bangalore One / Grama One).
            Never pay any unauthorized middlemen or share confidential passwords.
          </Alert>
        </section>

        {/* Trust Notice */}
        <TrustNotice />
      </main>
    </div>
  );
}
