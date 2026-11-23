import Link from 'next/link';
import { LocationCard } from '@/components/LocationCard';
import { LanguageSwitcher } from '@/components/LanguageSwitcher';
import { fetchLocations } from '@/lib/catalogue';
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

interface LocationsPageProps {
  searchParams?: Promise<{
    district?: string;
    centerType?: string;
  }>;
}

export default async function LocationsPage({ searchParams }: LocationsPageProps) {
  const env = getWebEnv();
  const { district, centerType } = (await searchParams) ?? {};

  const locations = await fetchLocations({
    district: district && district !== 'ALL' ? district : undefined,
    centerType: centerType && centerType !== 'ALL' ? centerType : undefined,
  });

  const districts = ['ALL', 'Bengaluru Urban', 'Dharwad', 'Mysuru', 'Mandya'];
  const centerTypes = [
    { label: 'All Centers', value: 'ALL' },
    { label: 'Bangalore / Karnataka One', value: 'B1_K1_CENTRE' },
    { label: 'Nadakacheri (AJSK)', value: 'NADAKACHERI' },
    { label: 'Taluk Office', value: 'TALUK_OFFICE' },
    { label: 'Grama One / Seva Kendra', value: 'SEVA_KENDRA' },
  ];

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
          className="text-sm font-semibold text-civic-navy underline px-3 py-1.5 rounded transition-colors"
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
            { label: 'Service Centers', href: '/locations', current: true },
          ]}
        />

        <div className="space-y-3">
          <p className="text-xs font-bold uppercase tracking-wider text-civic-green font-heading">
            Physical Citizen Assistance
          </p>
          <Heading as="h1" size="h1" className="text-civic-navy">
            Official Service Centers & Desks
          </Heading>
          <Paragraph size="large" className="text-civic-charcoal">
            Find nearby official Bangalore One, Karnataka One, Nadakacheri, and Taluk citizen
            service desks where you can complete biometric eKYC, submit physical documents, and
            receive authorized civic assistance.
          </Paragraph>
        </div>

        {/* Filters */}
        <div className="p-4 bg-white rounded-lg border border-civic-border space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* District Filter */}
            <div className="space-y-1">
              <label
                htmlFor="district-select"
                className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading"
              >
                District:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {districts.map((d) => {
                  const active = (district ?? 'ALL') === d;
                  const queryParam = d === 'ALL' ? '' : `district=${encodeURIComponent(d)}`;
                  const fullQuery = [
                    queryParam,
                    centerType && centerType !== 'ALL' ? `centerType=${centerType}` : '',
                  ]
                    .filter(Boolean)
                    .join('&');
                  return (
                    <Link
                      key={d}
                      href={fullQuery ? `/locations?${fullQuery}` : '/locations'}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold min-h-[44px] inline-flex items-center transition-colors ${
                        active
                          ? 'bg-civic-navy text-white shadow-sm'
                          : 'bg-civic-ivory text-civic-charcoal hover:bg-civic-border/50'
                      }`}
                    >
                      {d === 'ALL' ? 'All Districts' : d}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* Center Type Filter */}
            <div className="space-y-1">
              <label
                htmlFor="center-type-select"
                className="text-xs font-bold uppercase tracking-wider text-civic-muted font-heading"
              >
                Center Type:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {centerTypes.map((ct) => {
                  const active = (centerType ?? 'ALL') === ct.value;
                  const queryParam = ct.value === 'ALL' ? '' : `centerType=${ct.value}`;
                  const fullQuery = [
                    district && district !== 'ALL'
                      ? `district=${encodeURIComponent(district)}`
                      : '',
                    queryParam,
                  ]
                    .filter(Boolean)
                    .join('&');
                  return (
                    <Link
                      key={ct.value}
                      href={fullQuery ? `/locations?${fullQuery}` : '/locations'}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold min-h-[44px] inline-flex items-center transition-colors ${
                        active
                          ? 'bg-civic-navy text-white shadow-sm'
                          : 'bg-civic-ivory text-civic-charcoal hover:bg-civic-border/50'
                      }`}
                    >
                      {ct.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Location List */}
        {locations.length > 0 ? (
          <div className="space-y-4">
            {locations.map((loc) => (
              <LocationCard key={loc.id} location={loc} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center bg-white rounded-lg border border-civic-border space-y-2">
            <p className="font-heading font-bold text-civic-navy">No centers found</p>
            <p className="text-sm text-civic-muted">
              No official service centers match the chosen filters.
            </p>
            <Link
              href="/locations"
              className="inline-block mt-3 text-sm font-semibold text-civic-navy underline min-h-[44px]"
            >
              Reset filters
            </Link>
          </div>
        )}

        {/* Statutory Fee Notice */}
        <Alert variant="info" title="Official Center Protection Notice">
          Official Karnataka One and Nadakacheri centers charge prescribed government user fees only
          (with printed system-generated receipts). Never pay unauthorized persons or middlemen
          operating outside center counters.
        </Alert>

        <TrustNotice />
      </main>
    </div>
  );
}
