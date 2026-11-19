import {
  Alert,
  Breadcrumb,
  Button,
  Card,
  Checkbox,
  EmptyState,
  ErrorState,
  FormField,
  Header,
  Heading,
  Input,
  LoadingSkeleton,
  LoadingSpinner,
  NextStepCard,
  RadioGroup,
  Select,
  ServiceCard,
  SkipLink,
  Text,
  Textarea,
  TrustNotice,
  VerificationBadge,
} from '@janasahayak/ui';

export default function DesignSystemPage() {
  return (
    <div className="min-h-screen bg-civic-ivory text-civic-charcoal font-sans antialiased pb-16">
      <SkipLink targetId="main-content" />
      <Header
        brandName="JanaSahayak"
        tagline="Government services, explained simply."
        currentLanguage="EN"
      />

      <main id="main-content" className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12">
        <div className="space-y-3">
          <Breadcrumb
            items={[
              { label: 'Home', href: '/' },
              { label: 'Design System & Primitives', current: true },
            ]}
          />
          <Heading as="h1" size="h1">
            Design System &amp; Component Inventory
          </Heading>
          <Text size="large" variant="muted">
            Civic Editorial design direction — built for trust, clarity, accessibility, and high
            readability across Indian public-service journeys.
          </Text>
        </div>

        {/* Section 1: Trust Notice */}
        <section aria-labelledby="notice-section-title" className="space-y-3">
          <Heading as="h2" size="h3" id="notice-section-title">
            1. Trust &amp; Safety Notice
          </Heading>
          <TrustNotice />
        </section>

        {/* Section 2: Typography Scale */}
        <section aria-labelledby="typography-section-title" className="space-y-4">
          <Heading as="h2" size="h3" id="typography-section-title">
            2. Typography Scale (Manrope &amp; Inter)
          </Heading>
          <Card className="space-y-4">
            <div>
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider block mb-1">
                Display
              </span>
              <Heading as="h2" size="display">
                Government services, explained simply.
              </Heading>
            </div>
            <div>
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider block mb-1">
                Heading 1
              </span>
              <Heading as="h2" size="h1">
                Post-Matric Scholarship Scheme
              </Heading>
            </div>
            <div>
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider block mb-1">
                Heading 2
              </span>
              <Heading as="h3" size="h2">
                Eligibility &amp; Required Documents
              </Heading>
            </div>
            <div>
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider block mb-1">
                Heading 3
              </span>
              <Heading as="h4" size="h3">
                How to obtain an Income Certificate
              </Heading>
            </div>
            <div>
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider block mb-1">
                Heading 4
              </span>
              <Heading as="h5" size="h4">
                Step 1: Verify your documents
              </Heading>
            </div>
            <div className="pt-2 border-t border-civic-border/60 space-y-2">
              <Text size="large">
                Body Large: JanaSahayak is an independent civic guidance layer helping citizens
                navigate everyday government tasks.
              </Text>
              <Text size="base">
                Body Base: Standard informational paragraph text with comfortable line-height for
                long reading sessions.
              </Text>
              <Text size="small" variant="muted">
                Body Small (Muted): Secondary metadata, issuer names, and supporting notes.
              </Text>
              <Text size="caption" variant="muted">
                Caption: Source verification timestamps and legal disclaimers.
              </Text>
            </div>
          </Card>
        </section>

        {/* Section 3: Buttons */}
        <section aria-labelledby="buttons-section-title" className="space-y-4">
          <Heading as="h2" size="h3" id="buttons-section-title">
            3. Action Buttons (WCAG 44px+ Touch Targets)
          </Heading>
          <Card className="space-y-4">
            <div className="flex flex-wrap items-center gap-3">
              <Button variant="primary">Check eligibility</Button>
              <Button variant="secondary">View details</Button>
              <Button variant="tertiary">Learn more →</Button>
              <Button variant="danger">Remove saved journey</Button>
              <Button variant="primary" loading>
                Verifying rules...
              </Button>
            </div>
            <div className="pt-3 border-t border-civic-border/60 flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">
                Small (36px)
              </Button>
              <Button variant="primary" size="md">
                Standard (44px)
              </Button>
              <Button variant="primary" size="lg">
                Large (48px)
              </Button>
            </div>
          </Card>
        </section>

        {/* Section 4: Form Controls */}
        <section aria-labelledby="forms-section-title" className="space-y-4">
          <Heading as="h2" size="h3" id="forms-section-title">
            4. Accessible Form Controls
          </Heading>
          <Card className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              id="citizen-state"
              label="State of Residence"
              helperText="Choose the state where you currently reside or hold domicile."
              required
            >
              {(props) => (
                <Select
                  {...props}
                  options={[
                    { value: 'KA', label: 'Karnataka' },
                    { value: 'MH', label: 'Maharashtra' },
                    { value: 'DL', label: 'Delhi' },
                  ]}
                  placeholder="Select your state"
                />
              )}
            </FormField>

            <FormField
              id="citizen-annual-income"
              label="Annual Family Income (₹)"
              helperText="As stated on your current income certificate."
              error="Income amount must be a positive number."
              required
            >
              {(props) => <Input {...props} type="number" placeholder="e.g. 150000" />}
            </FormField>

            <div className="md:col-span-2">
              <FormField
                id="citizen-query"
                label="Describe your situation in simple words"
                helperText="Do not include passwords, Aadhaar numbers, or bank credentials."
              >
                {(props) => (
                  <Textarea
                    {...props}
                    rows={3}
                    placeholder="e.g. I am a first-year college student looking for hostel fee assistance..."
                  />
                )}
              </FormField>
            </div>

            <div className="md:col-span-2 space-y-3">
              <Checkbox
                id="doc-check"
                label="I have a valid Income Certificate"
                description="Issued within the last 12 months by the Tehsildar or revenue authority."
              />

              <RadioGroup
                name="student-category"
                label="Current Education Level"
                options={[
                  { value: 'matric', label: 'Class 10 (Secondary)' },
                  { value: 'puc', label: 'Class 12 / Pre-University (Higher Secondary)' },
                  { value: 'ug', label: 'Undergraduate Degree' },
                ]}
                value="ug"
                required
              />
            </div>
          </Card>
        </section>

        {/* Section 5: Cards & Entity Displays */}
        <section aria-labelledby="cards-section-title" className="space-y-4">
          <Heading as="h2" size="h3" id="cards-section-title">
            5. Entity Cards &amp; Signature Next Step
          </Heading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <ServiceCard
              title="Post-Matric Scholarship Scheme"
              summary="Financial assistance for students belonging to SC/ST/OBC and minority communities pursuing post-secondary education."
              departmentName="Social Welfare Department"
              stateCode="KA"
              verificationStatus="VERIFIED"
              actionLabel="Check eligibility"
            />

            <NextStepCard
              stepNumber={1}
              title="Obtain Income &amp; Caste Certificate"
              description="Before submitting the scholarship form, ensure your annual family income certificate is updated."
              actionLabel="Open Nadakacheri Portal"
              actionHref="https://nadakacheri.karnataka.gov.in"
              isOfficialRoute
            />
          </div>
        </section>

        {/* Section 6: Alerts & Verification Badges */}
        <section aria-labelledby="alerts-section-title" className="space-y-4">
          <Heading as="h2" size="h3" id="alerts-section-title">
            6. Alerts &amp; Verification Badges
          </Heading>
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <VerificationBadge status="VERIFIED" lastVerifiedAt="17 Nov 2026" />
              <VerificationBadge status="REVIEW_DUE" />
              <VerificationBadge status="UNVERIFIED" />
            </div>

            <Alert variant="info" title="Application Window Notice">
              Applications for the current academic cycle are open until 31 December 2026.
            </Alert>

            <Alert variant="warning" title="Document Expiration Alert">
              Income certificates issued prior to 1 April 2025 may not be accepted by the portal.
            </Alert>

            <Alert variant="critical" title="Official Source Warning">
              Never pay unauthorized agents or intermediaries for government application forms.
            </Alert>

            <Alert variant="success" title="Eligibility Verified">
              Based on your answers, you meet the standard eligibility criteria for this scheme.
            </Alert>
          </div>
        </section>

        {/* Section 7: Empty, Loading, and Error States */}
        <section aria-labelledby="states-section-title" className="space-y-4">
          <Heading as="h2" size="h3" id="states-section-title">
            7. Empty, Loading, and Error States
          </Heading>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="flex flex-col justify-between">
              <span className="text-xs font-semibold text-civic-muted uppercase tracking-wider mb-2">
                Loading Skeleton &amp; Spinner
              </span>
              <div className="space-y-4 py-4">
                <LoadingSpinner label="Checking official source freshness..." />
                <LoadingSkeleton lines={3} />
              </div>
            </Card>

            <EmptyState
              title="No services found"
              description="We couldn't find matching public services for your search keywords."
              whyItMatters="Using everyday terms like 'college fees' or 'caste certificate' helps match verified schemes."
              actionLabel="View all categories"
              actionHref="/"
            />

            <ErrorState
              title="Connection interrupted"
              message="We could not reach the service catalogue right now. You can retry or browse offline guides."
              retryLabel="Try again"
            />
          </div>
        </section>
      </main>
    </div>
  );
}
