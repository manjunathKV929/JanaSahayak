import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import {
  auditLogQuerySchema,
  createServiceSchema,
  createServiceSourceSchema,
  createServiceVersionSchema,
  publishServiceSchema,
  reviewDecisionSchema,
  submitReviewSchema,
  updateServiceSchema,
} from './admin.js';

describe('@janasahayak/validation Admin Schemas', () => {
  test('validates valid service creation input', () => {
    const valid = {
      slug: 'synthetic-birth-certificate',
      serviceType: 'CERTIFICATE',
      title: 'Birth Certificate Guidance',
      shortDescription:
        'Guidance for obtaining a birth certificate issued by municipal authorities.',
      departmentName: 'Department of Municipal Administration',
      stateCode: 'KA',
    };

    const parsed = createServiceSchema.safeParse(valid);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.slug, 'synthetic-birth-certificate');
      assert.equal(parsed.data.stateCode, 'KA');
    }
  });

  test('rejects invalid service slugs', () => {
    const invalidSlugs = ['Birth_Certificate', 'service 123', 'invalid--slug', '-leading-hyphen'];
    for (const slug of invalidSlugs) {
      const res = createServiceSchema.safeParse({
        slug,
        serviceType: 'SCHEME',
        title: 'Title',
        shortDescription: 'Description of reasonable length.',
        departmentName: 'Department',
      });
      assert.equal(res.success, false, `Expected ${slug} to fail validation`);
    }
  });

  test('validates service update input with at least one field', () => {
    const empty = updateServiceSchema.safeParse({});
    assert.equal(empty.success, false);

    const validUpdate = updateServiceSchema.safeParse({ title: 'Updated Scheme Title' });
    assert.equal(validUpdate.success, true);
  });

  test('validates version creation requiring non-empty content', () => {
    const emptyContent = createServiceVersionSchema.safeParse({
      content: {},
      language: 'en',
    });
    assert.equal(emptyContent.success, false);

    const validVersion = createServiceVersionSchema.safeParse({
      content: { summary: 'Official guidelines version 1' },
      language: 'kn',
      effectiveFrom: '2026-04-01',
    });
    assert.equal(validVersion.success, true);
  });

  test('enforces HTTPS for official source metadata URLs', () => {
    const insecureSource = createServiceSourceSchema.safeParse({
      sourceUrl: 'http://insecure-portal.gov.in/service',
      sourceType: 'OFFICIAL_PORTAL',
      publisher: 'State Portal',
    });
    assert.equal(insecureSource.success, false);

    const validSource = createServiceSourceSchema.safeParse({
      sourceUrl: 'https://sevasindhu.karnataka.gov.in/service',
      sourceType: 'OFFICIAL_PORTAL',
      publisher: 'Department of e-Governance',
      verificationStatus: 'VERIFIED',
    });
    assert.equal(validSource.success, true);
  });

  test('validates review decisions and status transitions', () => {
    const validDecisions = ['APPROVED', 'REJECTED', 'CHANGES_REQUESTED'] as const;
    for (const decision of validDecisions) {
      const parsed = reviewDecisionSchema.safeParse({ decision, notes: 'Detailed review notes' });
      assert.equal(parsed.success, true);
    }

    const invalid = reviewDecisionSchema.safeParse({ decision: 'UNKNOWN_STATUS' });
    assert.equal(invalid.success, false);
  });

  test('validates submit-review, publish, and audit log query schemas', () => {
    const submit = submitReviewSchema.safeParse({ notes: 'Ready for editorial review.' });
    assert.equal(submit.success, true);

    const publish = publishServiceSchema.safeParse({
      versionId: '123e4567-e89b-12d3-a456-426614174000',
    });
    assert.equal(publish.success, true);

    const query = auditLogQuerySchema.safeParse({
      limit: '15',
      offset: '30',
      resourceType: 'service',
    });
    assert.equal(query.success, true);
    if (query.success) {
      assert.equal(query.data.limit, 15);
      assert.equal(query.data.offset, 30);
      assert.equal(query.data.resourceType, 'service');
    }
  });
});
