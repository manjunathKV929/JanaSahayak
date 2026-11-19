import assert from 'node:assert/strict';
import test, { describe } from 'node:test';
import { searchServicesQuerySchema, serviceSlugParamSchema } from './catalogue.js';

describe('@janasahayak/validation Catalogue Schemas', () => {
  test('validates valid search query parameters', () => {
    const valid = {
      q: 'scholarship',
      category: 'SCHEME',
      state: 'KA',
      limit: '25',
      offset: '50',
    };

    const parsed = searchServicesQuerySchema.safeParse(valid);
    assert.equal(parsed.success, true);
    if (parsed.success) {
      assert.equal(parsed.data.q, 'scholarship');
      assert.equal(parsed.data.category, 'SCHEME');
      assert.equal(parsed.data.state, 'KA');
      assert.equal(parsed.data.limit, 25);
      assert.equal(parsed.data.offset, 50);
      assert.equal(parsed.data.language, 'en');
    }
  });

  test('validates slug parameter', () => {
    const valid = serviceSlugParamSchema.safeParse({ slug: 'karnataka-scholarship-scheme' });
    assert.equal(valid.success, true);

    const invalid = serviceSlugParamSchema.safeParse({ slug: 'INVALID SLUG!' });
    assert.equal(invalid.success, false);
  });
});
