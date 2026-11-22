import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { documentGuideQuerySchema, documentIdParamSchema } from './documents.js';

describe('@janasahayak/validation Documents Schemas', () => {
  it('validates valid document identifier parameter', () => {
    const validUuid = documentIdParamSchema.safeParse({
      id: 'd0000000-0000-0000-0000-000000000001',
    });
    assert.equal(validUuid.success, true);

    const validSlug = documentIdParamSchema.safeParse({ id: 'income-certificate' });
    assert.equal(validSlug.success, true);
  });

  it('rejects invalid or dangerous document identifier parameter', () => {
    const empty = documentIdParamSchema.safeParse({ id: '' });
    assert.equal(empty.success, false);

    const dangerous = documentIdParamSchema.safeParse({ id: '../secrets/doc' });
    assert.equal(dangerous.success, false);

    const spaces = documentIdParamSchema.safeParse({ id: 'doc with space' });
    assert.equal(spaces.success, false);
  });

  it('validates document guide query parameters', () => {
    const valid = documentGuideQuerySchema.safeParse({
      returnTo: '/services/synthetic-post-matric-scholarship',
      language: 'kn',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.language, 'kn');
      assert.equal(valid.data.returnTo, '/services/synthetic-post-matric-scholarship');
    }

    const empty = documentGuideQuerySchema.safeParse({});
    assert.equal(empty.success, true);

    const invalidLang = documentGuideQuerySchema.safeParse({
      language: 'french',
    });
    assert.equal(invalidLang.success, false);
  });
});
