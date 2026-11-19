import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import {
  borderRadius,
  colors,
  containers,
  spacing,
  touchTargets,
  typography,
} from './tokens/index.js';
import { Heading, Text } from './components/Typography.js';
import { Button } from './components/Button.js';
import { Checkbox, FormField, Input, RadioGroup, Select, Textarea } from './components/Forms.js';
import { Breadcrumb, Header, SkipLink } from './components/Navigation.js';
import { Card, NextStepCard, ServiceCard } from './components/Cards.js';
import { Alert, TrustNotice, VerificationBadge } from './components/Alerts.js';
import { EmptyState, ErrorState, LoadingSkeleton, LoadingSpinner } from './components/States.js';

describe('@janasahayak/ui Design Tokens', () => {
  it('exposes authentic Civic Editorial color tokens per DESIGN.md', () => {
    assert.equal(colors.brand.primaryNavy, '#183B50');
    assert.equal(colors.brand.primaryNavyDark, '#102D3D');
    assert.equal(colors.brand.civicGreen, '#386B55');
    assert.equal(colors.brand.warmIvory, '#F7F6F1');
    assert.equal(colors.brand.charcoal, '#263238');
    assert.equal(colors.brand.border, '#DDE3E5');
    assert.equal(colors.status.error, '#B42318');
    assert.equal(colors.status.warning, '#A66A18');
  });

  it('exposes typography, spacing, border radius, and touch target constraints', () => {
    assert.ok(typography.h1.fontSize.includes('clamp'));
    assert.equal(spacing[1], '4px');
    assert.equal(spacing[4], '16px');
    assert.equal(spacing[16], '64px');
    assert.equal(borderRadius.sm, '6px');
    assert.equal(borderRadius.lg, '12px');
    assert.equal(borderRadius.pill, '9999px');
    assert.equal(containers.readingWidth, '720px');
    assert.equal(touchTargets.minTouchSize, '44px');
  });
});

describe('@janasahayak/ui Components Semantics & Accessibility', () => {
  it('renders semantic headings and typography', () => {
    const headingHtml = renderToStaticMarkup(
      <Heading as="h1" size="display">
        Public Services
      </Heading>,
    );
    assert.ok(headingHtml.startsWith('<h1'));
    assert.ok(headingHtml.includes('Public Services'));
    assert.ok(headingHtml.includes('text-civic-navy'));

    const textHtml = renderToStaticMarkup(
      <Text size="small" variant="muted">
        Verified information
      </Text>,
    );
    assert.ok(textHtml.includes('text-civic-muted'));
  });

  it('renders accessible Button with variants and loading state', () => {
    const primaryHtml = renderToStaticMarkup(<Button variant="primary">Check eligibility</Button>);
    assert.ok(primaryHtml.includes('type="button"'));
    assert.ok(primaryHtml.includes('bg-civic-navy'));
    assert.ok(primaryHtml.includes('min-h-[44px]'));

    const loadingHtml = renderToStaticMarkup(
      <Button loading variant="secondary">
        Evaluating
      </Button>,
    );
    assert.ok(loadingHtml.includes('disabled=""'));
    assert.ok(loadingHtml.includes('aria-busy="true"'));
    assert.ok(loadingHtml.includes('animate-spin'));
  });

  it('renders accessible FormField and Input with linked IDs and error alert', () => {
    const fieldHtml = renderToStaticMarkup(
      <FormField
        id="citizen-income"
        label="Annual Family Income"
        helperText="Enter approximate income in rupees"
        error="Income is required"
        required
      >
        {(props) => <Input {...props} placeholder="₹ 2,00,000" />}
      </FormField>,
    );

    assert.ok(fieldHtml.includes('for="citizen-income"'));
    assert.ok(fieldHtml.includes('id="citizen-income"'));
    assert.ok(fieldHtml.includes('aria-describedby="citizen-income-helper citizen-income-error"'));
    assert.ok(fieldHtml.includes('aria-invalid="true"'));
    assert.ok(fieldHtml.includes('role="alert"'));
    assert.ok(fieldHtml.includes('Income is required'));
  });

  it('renders Select and Textarea with accessible states', () => {
    const selectHtml = renderToStaticMarkup(
      <Select
        options={[
          { value: 'KA', label: 'Karnataka' },
          { value: 'MH', label: 'Maharashtra' },
        ]}
        placeholder="Select state"
      />,
    );
    assert.ok(selectHtml.includes('<select'));
    assert.ok(selectHtml.includes('Karnataka'));

    const textareaHtml = renderToStaticMarkup(<Textarea rows={3} />);
    assert.ok(textareaHtml.includes('<textarea rows="3"'));
  });

  it('renders Checkbox and RadioGroup with accessible labels and legends', () => {
    const checkboxHtml = renderToStaticMarkup(
      <Checkbox id="c1" label="I have an Aadhaar card" description="Required for verification" />,
    );
    assert.ok(checkboxHtml.includes('type="checkbox"'));
    assert.ok(checkboxHtml.includes('for="c1"'));

    const radioHtml = renderToStaticMarkup(
      <RadioGroup
        name="gender"
        label="Gender"
        options={[
          { value: 'female', label: 'Female' },
          { value: 'male', label: 'Male' },
        ]}
        value="female"
        onChange={() => {}}
      />,
    );
    assert.ok(radioHtml.includes('<fieldset'));
    assert.ok(radioHtml.includes('<legend'));
    assert.ok(radioHtml.includes('type="radio"'));
    assert.ok(radioHtml.includes('checked=""'));
  });

  it('renders Navigation landmarks, Breadcrumbs, and SkipLink', () => {
    const skipHtml = renderToStaticMarkup(<SkipLink targetId="main-content" />);
    assert.ok(skipHtml.includes('href="#main-content"'));
    assert.ok(skipHtml.includes('sr-only focus:not-sr-only'));

    const headerHtml = renderToStaticMarkup(
      <Header brandName="JanaSahayak" tagline="Government services, explained simply." />,
    );
    assert.ok(headerHtml.includes('role="banner"'));
    assert.ok(headerHtml.includes('aria-label="Primary"'));
    assert.ok(headerHtml.includes('JanaSahayak'));

    const breadcrumbHtml = renderToStaticMarkup(
      <Breadcrumb
        items={[
          { label: 'Home', href: '/' },
          { label: 'Services', href: '/services' },
          { label: 'Scholarship', current: true },
        ]}
      />,
    );
    assert.ok(breadcrumbHtml.includes('aria-label="Breadcrumb"'));
    assert.ok(breadcrumbHtml.includes('aria-current="page"'));
  });

  it('renders ServiceCard and NextStepCard entity surfaces', () => {
    const baseCardHtml = renderToStaticMarkup(<Card elevation="subtle">Basic entity content</Card>);
    assert.ok(baseCardHtml.includes('Basic entity content'));
    assert.ok(baseCardHtml.includes('shadow-sm'));

    const serviceHtml = renderToStaticMarkup(
      <ServiceCard
        title="Post-Matric Scholarship"
        summary="Financial assistance for eligible post-secondary students."
        departmentName="Social Welfare Department"
        stateCode="KA"
        verificationStatus="VERIFIED"
      />,
    );
    assert.ok(serviceHtml.includes('Post-Matric Scholarship'));
    assert.ok(serviceHtml.includes('Social Welfare Department'));
    assert.ok(serviceHtml.includes('Verified'));

    const nextStepHtml = renderToStaticMarkup(
      <NextStepCard
        stepNumber={1}
        title="Obtain Income Certificate"
        description="Apply at your local Nadakacheri or Seva Sindhu center."
        actionLabel="View issuing steps"
        isOfficialRoute
      />,
    );
    assert.ok(nextStepHtml.includes('Step 1 — Your Next Action'));
    assert.ok(nextStepHtml.includes('Official Portal Route'));
    assert.ok(nextStepHtml.includes('Obtain Income Certificate'));
  });

  it('renders Alert, VerificationBadge, and TrustNotice', () => {
    const alertHtml = renderToStaticMarkup(
      <Alert variant="critical" title="Application Deadline Passed">
        New applications are currently closed.
      </Alert>,
    );
    assert.ok(alertHtml.includes('role="alert"'));
    assert.ok(alertHtml.includes('Application Deadline Passed'));

    const badgeHtml = renderToStaticMarkup(
      <VerificationBadge status="VERIFIED" lastVerifiedAt="17 Nov 2026" />,
    );
    assert.ok(badgeHtml.includes('Verified'));
    assert.ok(badgeHtml.includes('17 Nov 2026'));

    const noticeHtml = renderToStaticMarkup(<TrustNotice />);
    assert.ok(noticeHtml.includes('Guidance layer, not a government authority'));
    assert.ok(noticeHtml.includes('Never enter OTPs, bank passwords'));
  });

  it('renders EmptyState, LoadingSkeleton, and ErrorState', () => {
    const emptyHtml = renderToStaticMarkup(
      <EmptyState
        title="No services found"
        description="We could not find matching schemes for this query."
        whyItMatters="Clarifying your query helps retrieve verified benefits."
        actionLabel="Browse all categories"
        actionHref="/categories"
      />,
    );
    assert.ok(emptyHtml.includes('role="status"'));
    assert.ok(emptyHtml.includes('No services found'));
    assert.ok(emptyHtml.includes('Why this matters:'));

    const skeletonHtml = renderToStaticMarkup(<LoadingSkeleton lines={3} />);
    assert.ok(skeletonHtml.includes('aria-busy="true"'));
    assert.ok(skeletonHtml.includes('animate-pulse'));

    const spinnerHtml = renderToStaticMarkup(<LoadingSpinner label="Evaluating rules..." />);
    assert.ok(spinnerHtml.includes('role="status"'));
    assert.ok(spinnerHtml.includes('Evaluating rules...'));

    const errorHtml = renderToStaticMarkup(
      <ErrorState title="Unable to retrieve scheme" message="Please retry." onRetry={() => {}} />,
    );
    assert.ok(errorHtml.includes('role="alert"'));
    assert.ok(errorHtml.includes('Unable to retrieve scheme'));
    assert.ok(errorHtml.includes('Try again'));
  });
});
