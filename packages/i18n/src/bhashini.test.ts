import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { BhashiniService, MockBhashiniProvider } from './bhashini.js';
import { NumericPreservationViolationError, assertNumericPreservation } from './numeric-guard.js';

describe('@janasahayak/i18n Bhashini AI translation', () => {
  it('returns identical text when source and target languages match', async () => {
    const provider = new MockBhashiniProvider();
    const result = await provider.translate({
      text: 'Income Certificate',
      sourceLanguage: 'en',
      targetLanguage: 'en',
    });

    assert.equal(result.translatedText, 'Income Certificate');
    assert.equal(result.sourceLanguage, 'en');
    assert.equal(result.targetLanguage, 'en');
  });

  it('translates curated civic terminology accurately to Hindi and Kannada', async () => {
    const provider = new MockBhashiniProvider();

    const hiIncome = await provider.translate({
      text: 'Income Certificate',
      targetLanguage: 'hi',
    });
    assert.equal(hiIncome.translatedText, 'आय प्रमाण पत्र');

    const knIncome = await provider.translate({
      text: 'Income Certificate',
      targetLanguage: 'kn',
    });
    assert.equal(knIncome.translatedText, 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ');

    const knSenior = await provider.translate({
      text: 'Senior Citizen Card',
      targetLanguage: 'kn',
    });
    assert.equal(knSenior.translatedText, 'ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿ');
  });

  it('translates threshold sentences and preserves numbers', async () => {
    const provider = new MockBhashiniProvider();

    const hiThreshold = await provider.translate({
      text: 'Annual family income must be below ₹2,50,000',
      targetLanguage: 'hi',
    });
    assert.equal(hiThreshold.translatedText, 'वार्षिक पारिवारिक आय ₹2,50,000 से कम होनी चाहिए');
    assert.equal(hiThreshold.preservedNumbers, true);

    const knThreshold = await provider.translate({
      text: 'Applicant must be aged 60 years or above',
      targetLanguage: 'kn',
    });
    assert.equal(knThreshold.translatedText, 'ಅರ್ಜಿದಾರರು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನವರಾಗಿರಬೇಕು');
    assert.equal(knThreshold.preservedNumbers, true);
  });

  it('translates batches of requests in parallel', async () => {
    const provider = new MockBhashiniProvider();
    const results = await provider.translateBatch([
      { text: 'Income Certificate', targetLanguage: 'kn' },
      { text: 'Caste Certificate', targetLanguage: 'kn' },
    ]);

    assert.equal(results.length, 2);
    assert.equal(results[0]?.translatedText, 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ');
    assert.equal(results[1]?.translatedText, 'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ');
  });

  it('caches translations in BhashiniService to avoid redundant work', async () => {
    const service = new BhashiniService({ useMock: true });

    const first = await service.translate({
      text: 'Income Certificate',
      targetLanguage: 'kn',
    });
    assert.equal(first.translatedText, 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ');
    assert.equal(first.cached, undefined);

    const second = await service.translate({
      text: 'Income Certificate',
      targetLanguage: 'kn',
    });
    assert.equal(second.translatedText, 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ');
    assert.equal(second.cached, true);
  });

  it('strictly enforces numeric preservation and rejects modified rules', async () => {
    // If a provider implementation drops numbers
    const faultyProvider = {
      async translate() {
        return {
          translatedText: 'ಆದಾಯ ಮಿತಿ ಇರಬೇಕು', // dropped ₹2,50,000
          sourceLanguage: 'en' as const,
          targetLanguage: 'kn' as const,
          provider: 'mock' as const,
        };
      },
      async translateBatch() {
        return [];
      },
    };

    const textWithNumber = 'Income must be below ₹2,50,000';
    const result = await faultyProvider.translate();

    assert.throws(
      () => {
        assertNumericPreservation(textWithNumber, result.translatedText);
      },
      (err: unknown) => err instanceof NumericPreservationViolationError,
    );
  });
});
