import Link from 'next/link';
import { getWebEnv } from '@/lib/env';
import { fetchCategories, fetchPublishedServices } from '@/lib/catalogue';
import {
  Alert,
  Button,
  Card,
  Header,
  Heading,
  Paragraph,
  ServiceCard,
  SkipLink,
  Text,
  TrustNotice,
} from '@janasahayak/ui';

export default async function HomePage() {
  const env = getWebEnv();
  const services = await fetchPublishedServices();
  const categories = await fetchCategories();

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

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
        {/* Hero Section with Problem-First Search */}
        <section aria-labelledby="hero-heading" className="space-y-6 pt-4">
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
              Public-Service Guidance Platform
            </p>
            <Heading as="h1" size="display" id="hero-heading" className="text-civic-navy">
              Government services, explained simply.
            </Heading>
            <Paragraph size="large" className="max-w-3xl text-civic-charcoal">
              Find public services that may help you, understand eligibility conditions, prepare
              required documents, and reach official application portals without confusion or
              intermediaries.
            </Paragraph>
          </div>

          {/* Problem-First Search Bar */}
          <form
            action="/services"
            method="GET"
            role="search"
            aria-label="Search government services"
            className="rounded-lg border-2 border-civic-navy/20 bg-white p-2 sm:p-3 shadow-civic focus-within:border-civic-navy transition-all"
          >
            <label htmlFor="search-input" className="sr-only">
              What do you need help with?
            </label>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                id="search-input"
                name="q"
                type="search"
                autoComplete="off"
                placeholder="What do you need help with? (e.g. scholarship, senior citizen card)"
                className="flex-1 px-4 py-3 text-base text-civic-charcoal placeholder:text-civic-muted focus:outline-none bg-transparent"
              />
              <Button type="submit" variant="primary" size="md" className="sm:self-stretch">
                Search Services
              </Button>
            </div>
          </form>

          {/* Quick Problem-First Suggestion Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-1">
            <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider font-heading">
              Popular searches:
            </span>
            <Link
              href="/services?q=scholarship"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-civic-navy/10 text-civic-navy hover:bg-civic-navy/20 transition-colors"
            >
              Post-Matric Scholarship
            </Link>
            <Link
              href="/services?q=senior"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-civic-navy/10 text-civic-navy hover:bg-civic-navy/20 transition-colors"
            >
              Senior Citizen Card
            </Link>
            <Link
              href="/services?category=SCHEME"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-civic-navy/10 text-civic-navy hover:bg-civic-navy/20 transition-colors"
            >
              Higher Education Schemes
            </Link>
            <Link
              href="/services?category=CERTIFICATE"
              className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-civic-navy/10 text-civic-navy hover:bg-civic-navy/20 transition-colors"
            >
              Official Certificates
            </Link>
          </div>
        </section>

        {/* Trust Notice */}
        <TrustNotice />

        {/* Featured Verified Services */}
        <section aria-labelledby="featured-heading" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <Heading as="h2" size="h2" id="featured-heading" className="text-civic-navy">
                Verified Public Services
              </Heading>
              <Text size="small" className="text-civic-muted">
                Authoritative public-service guidelines verified against official government
                portals.
              </Text>
            </div>
            <Link href="/services">
              <Button variant="secondary" size="sm">
                View all ({services.length}) →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                title={s.title}
                summary={s.shortDescription}
                departmentName={s.departmentName}
                stateCode={s.stateCode ?? undefined}
                verificationStatus={s.verification.status}
                actionLabel="Explore Service Guide"
                actionHref={`/services/${s.slug}`}
              />
            ))}
          </div>
        </section>

        {/* Browse by Category */}
        <section aria-labelledby="categories-heading" className="space-y-6">
          <div>
            <Heading as="h2" size="h2" id="categories-heading" className="text-civic-navy">
              Browse by Category
            </Heading>
            <Text size="small" className="text-civic-muted">
              Explore public assistance schemes, official certificates, and citizen welfare
              services.
            </Text>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c) => (
              <Link
                key={c.category}
                href={`/services?category=${encodeURIComponent(c.category)}`}
                className="group block"
              >
                <Card
                  variant="default"
                  className="p-5 h-full transition-all group-hover:border-civic-navy group-hover:shadow-civic"
                >
                  <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
                    {c.category === 'SCHEME' ? 'Assistance Schemes' : 'Identity & Certificates'}
                  </p>
                  <h3 className="text-lg font-bold text-civic-navy mt-1 group-hover:underline">
                    {c.category}
                  </h3>
                  <p className="text-sm text-civic-muted mt-2">
                    {c.count} verified {c.count === 1 ? 'service' : 'services'} available.
                  </p>
                </Card>
              </Link>
            ))}
          </div>
        </section>

        {/* How JanaSahayak Works */}
        <section aria-labelledby="how-it-works-heading" className="space-y-6">
          <Heading as="h2" size="h2" id="how-it-works-heading" className="text-civic-navy">
            How JanaSahayak Works
          </Heading>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card variant="bordered" className="p-6 space-y-3">
              <div className="w-8 h-8 rounded-full bg-civic-navy text-white flex items-center justify-center font-bold text-sm font-heading">
                1
              </div>
              <h3 className="font-heading font-bold text-lg text-civic-navy">
                Tell Us What You Need
              </h3>
              <p className="text-sm text-civic-charcoal">
                Search in plain language using your everyday words. No government jargon or scheme
                codes required.
              </p>
            </Card>

            <Card variant="bordered" className="p-6 space-y-3">
              <div className="w-8 h-8 rounded-full bg-civic-navy text-white flex items-center justify-center font-bold text-sm font-heading">
                2
              </div>
              <h3 className="font-heading font-bold text-lg text-civic-navy">
                Check Documents & Rules
              </h3>
              <p className="text-sm text-civic-charcoal">
                Deterministic rules explain whether you may qualify and list the exact documents
                needed before you apply.
              </p>
            </Card>

            <Card variant="bordered" className="p-6 space-y-3">
              <div className="w-8 h-8 rounded-full bg-civic-navy text-white flex items-center justify-center font-bold text-sm font-heading">
                3
              </div>
              <h3 className="font-heading font-bold text-lg text-civic-navy">
                Apply on Official Portals
              </h3>
              <p className="text-sm text-civic-charcoal">
                Step-by-step guidance leads directly to the official government portal with zero
                middlemen or fees.
              </p>
            </Card>
          </div>
        </section>

        {/* Security & Safety Notice */}
        <section aria-label="Citizen Safety Warning">
          <Alert variant="warning" title="Citizen Safety Advisory">
            JanaSahayak is an independent civic information platform. We never ask for your bank
            account details, Aadhaar OTPs, passwords, or payment. Never share confidential one-time
            passwords (OTPs) with anyone claiming to represent government departments.
          </Alert>
        </section>
      </main>

      {/* Editorial Footer */}
      <footer className="mt-16 border-t border-civic-border bg-white py-12">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="font-heading font-bold text-lg text-civic-navy">JanaSahayak</p>
              <p className="text-xs text-civic-muted">
                Public-service guidance layer. Not an official government authority.
              </p>
            </div>
            <div className="flex gap-4 text-xs font-semibold text-civic-navy">
              <Link href="/services" className="hover:underline">
                All Services
              </Link>
              <Link href="/design-system" className="hover:underline">
                Design System
              </Link>
              <a href="#top" className="hover:underline">
                Back to top ↑
              </a>
            </div>
          </div>
          <p className="text-xs text-civic-muted border-t border-civic-border/60 pt-4">
            All factual scheme content, documents, and links are cited from verified government
            portals and official orders.
          </p>
        </div>
      </footer>
    </div>
  );
}
