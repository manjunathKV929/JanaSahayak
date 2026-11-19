import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { getWebEnv } from './env.js';

describe('@janasahayak/web env configuration', () => {
  it('resolves safe defaults for web client configuration', () => {
    const env = getWebEnv({ NODE_ENV: 'test' });
    assert.equal(env.NEXT_PUBLIC_APP_NAME, 'JanaSahayak');
    assert.equal(env.NEXT_PUBLIC_API_BASE_URL, 'http://127.0.0.1:4000/api/v1');
    assert.equal(env.NEXT_PUBLIC_DEFAULT_LANGUAGE, 'en');
  });

  it('rejects unsupported default languages', () => {
    assert.throws(() =>
      getWebEnv({
        NODE_ENV: 'test',
        NEXT_PUBLIC_DEFAULT_LANGUAGE: 'de',
      }),
    );
  });
});
