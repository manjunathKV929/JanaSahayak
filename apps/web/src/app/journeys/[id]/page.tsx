import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JourneyStepper } from '@/components/JourneyStepper';
import { fetchPublishedServiceBySlug, SYNTHETIC_SAMPLE_SERVICES } from '@/lib/catalogue';
import { Breadcrumb, Card, Header, Heading, SkipLink, Text, TrustNotice } from '@janasahayak/ui';

interface JourneyPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function JourneyPage({ params }: JourneyPageProps) {
  const { id } = await params;

  // Find matching service by journey ID, service slug, or service UUID
  let detail = await fetchPublishedServiceBySlug(id);

  if (!detail) {
    const matched = SYNTHETIC_SAMPLE_SERVICES.find(
      (s) =>
        s.service.slug === id ||
        s.service.id === id ||
        s.journey?.id === id ||
        id.includes(s.service.slug),
    );
    if (matched) {
      detail = matched;
    }
  }

  if (!detail || !detail.journey) {
    notFound();
  }

  const { service, journey } = detail;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Services', href: '/services' },
    { label: service.title, href: `/services/${service.slug}` },
    { label: 'Application Journey', href: `/journeys/${id}`, current: true },
  ];

  return (
    <>
      <SkipLink targetId="main-content" />
      <Header />

      <main id="main-content" className="min-h-screen bg-civic-cream py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto space-y-6">
          <Breadcrumb items={breadcrumbs} />

          <TrustNotice />

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-civic-slate">
                {service.departmentName}
              </span>
              <span className="text-xs text-civic-muted">•</span>
              <span className="text-xs font-semibold text-civic-green">Verified Journey</span>
            </div>
            <Heading as="h1" size="h1" className="text-civic-navy">
              {journey.title}
            </Heading>
            <Text size="base" className="text-civic-charcoal">
              {journey.description}
            </Text>
          </div>

          {/* Interactive Journey Stepper Engine */}
          <JourneyStepper service={detail} />

          {/* Return to Service Overview */}
          <Card variant="bordered" className="p-4 bg-surface text-center">
            <Link
              href={`/services/${service.slug}`}
              className="text-sm font-semibold text-primary hover:underline inline-flex items-center gap-1.5"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 19l-7-7m0 0l7-7m-7 7h18"
                />
              </svg>
              <span>Return to Full Service Details & Requirements</span>
            </Link>
          </Card>
        </div>
      </main>
    </>
  );
}
