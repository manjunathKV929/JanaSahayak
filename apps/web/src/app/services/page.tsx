import Link from 'next/link';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { fetchCategories, fetchPublishedServices } from '@/lib/catalogue';
import { getWebEnv } from '@/lib/env';
import {
  Breadcrumb,
  Button,
  EmptyState,
  Header,
  Heading,
  Paragraph,
  ServiceCard,
  SkipLink,
  Text,
} from '@janasahayak/ui';

interface ServicesPageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    state?: string;
  }>;
}

export default async function ServicesPage({ searchParams }: ServicesPageProps) {
  const env = getWebEnv();
  const params = await searchParams;
  const q = typeof params.q === 'string' ? params.q : undefined;
  const category = typeof params.category === 'string' ? params.category : undefined;
  const state = typeof params.state === 'string' ? params.state : undefined;

  const services = await fetchPublishedServices({ q, category, state });
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
          href="/"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Home
        </Link>
        <Link
          href="/design-system"
          className="text-sm font-semibold text-civic-navy hover:underline px-3 py-1.5 rounded transition-colors"
        >
          Design System
        </Link>
        <LanguageSwitcher compact />
      </Header>

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: 'Home', href: '/' },
            { label: 'Public Catalogue', href: '/services', current: true },
          ]}
        />

        {/* Page Header */}
        <div className="space-y-2">
          <Heading as="h1" size="h1" className="text-civic-navy">
            Verified Service Catalogue
          </Heading>
          <Paragraph className="text-civic-charcoal max-w-2xl">
            Browse verified public services, eligibility rules, and required application documents.
            All records are verified from authoritative government portals.
          </Paragraph>
        </div>

        {/* Search & Filter Form */}
        <form
          action="/services"
          method="GET"
          role="search"
          aria-label="Filter catalogue services"
          className="rounded-lg border border-civic-border bg-white p-4 shadow-civic space-y-4"
        >
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label htmlFor="search-q" className="sr-only">
                Search services
              </label>
              <input
                id="search-q"
                name="q"
                type="search"
                defaultValue={q ?? ''}
                placeholder="Search services by keyword or need (e.g. scholarship, pension)..."
                className="w-full rounded border border-civic-border px-3.5 py-2.5 text-sm text-civic-charcoal placeholder:text-civic-muted focus:border-civic-navy focus:outline-none"
              />
            </div>

            <div className="flex gap-2">
              <select
                name="category"
                aria-label="Filter by service category"
                defaultValue={category ?? ''}
                className="rounded border border-civic-border px-3 py-2.5 text-sm text-civic-charcoal bg-white focus:border-civic-navy focus:outline-none"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.category} value={c.category}>
                    {c.category} ({c.count})
                  </option>
                ))}
              </select>

              <select
                name="state"
                aria-label="Filter by state"
                defaultValue={state ?? ''}
                className="rounded border border-civic-border px-3 py-2.5 text-sm text-civic-charcoal bg-white focus:border-civic-navy focus:outline-none"
              >
                <option value="">All States</option>
                <option value="KA">Karnataka (KA)</option>
              </select>

              <Button type="submit" variant="primary" size="sm">
                Filter
              </Button>
            </div>
          </div>

          {/* Active Filter Tags */}
          {(q || category || state) && (
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-civic-border/60">
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider font-heading">
                Active filters:
              </span>
              {q && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-civic-navy/10 text-xs font-medium text-civic-navy">
                  Query: &ldquo;{q}&rdquo;
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-civic-navy/10 text-xs font-medium text-civic-navy">
                  Category: {category}
                </span>
              )}
              {state && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-civic-navy/10 text-xs font-medium text-civic-navy">
                  State: {state}
                </span>
              )}
              <Link
                href="/services"
                className="text-xs font-semibold text-civic-crimson hover:underline ml-2"
              >
                Clear all filters
              </Link>
            </div>
          )}
        </form>

        {/* Results Count Summary */}
        <div className="flex items-center justify-between border-b border-civic-border pb-3">
          <Text size="small" className="font-semibold text-civic-navy">
            Showing {services.length} {services.length === 1 ? 'service' : 'services'}
          </Text>
        </div>

        {/* Services List / Grid */}
        {services.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {services.map((s) => (
              <ServiceCard
                key={s.id}
                title={s.title}
                summary={s.shortDescription}
                departmentName={s.departmentName}
                stateCode={s.stateCode ?? undefined}
                verificationStatus={s.verification.status}
                actionLabel="View Guidance & Checklist"
                actionHref={`/services/${s.slug}`}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No verified services found"
            description="We could not find any services matching your search filters. Try adjusting your search keywords or clearing state/category filters."
            actionLabel="View All Services"
            actionHref="/services"
          />
        )}
      </main>
    </div>
  );
}
