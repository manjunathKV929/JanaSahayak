import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  batchTranslateRequestSchema,
  languageQuerySchema,
  translateRequestSchema,
} from './i18n.js';

describe('@janasahayak/validation i18n schemas', () => {
  it('validates single translation request successfully', () => {
    const valid = translateRequestSchema.parse({
      text: 'Income certificate needed for college admission',
      targetLanguage: 'kn',
    });
    assert.equal(valid.text, 'Income certificate needed for college admission');
    assert.equal(valid.sourceLanguage, 'en');
    assert.equal(valid.targetLanguage, 'kn');
    assert.equal(valid.preserveNumbers, true);
  });

  it('rejects empty translation text or unsupported language', () => {
    assert.throws(() =>
      translateRequestSchema.parse({
        text: '   ',
        targetLanguage: 'kn',
      }),
    );

    assert.throws(() =>
      translateRequestSchema.parse({
        text: 'Valid text',
        targetLanguage: 'french' as unknown as 'kn',
      }),
    );
  });

  it('validates batch translation request schema', () => {
    const valid = batchTranslateRequestSchema.parse({
      texts: ['Income Certificate', 'Caste Certificate'],
      targetLanguage: 'hi',
    });
    assert.equal(valid.texts.length, 2);
    assert.equal(valid.targetLanguage, 'hi');
  });

  it('validates optional language query schema', () => {
    assert.equal(languageQuerySchema.parse({}).language, undefined);
    assert.equal(languageQuerySchema.parse({ language: 'kn' }).language, 'kn');
    assert.throws(() => languageQuerySchema.parse({ language: 'de' }));
  });
});
