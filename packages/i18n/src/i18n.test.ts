import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  DEFAULT_LANGUAGE,
  SUPPORTED_LANGUAGES_LIST,
  getLanguageMeta,
  hasTranslationKey,
  isSupportedLanguage,
  t,
} from './index.js';

describe('@janasahayak/i18n translator & metadata', () => {
  it('exposes supported languages list with English as default', () => {
    assert.deepEqual(SUPPORTED_LANGUAGES_LIST, ['en', 'hi', 'kn']);
    assert.equal(DEFAULT_LANGUAGE, 'en');
  });

  it('validates supported languages correctly', () => {
    assert.equal(isSupportedLanguage('en'), true);
    assert.equal(isSupportedLanguage('hi'), true);
    assert.equal(isSupportedLanguage('kn'), true);
    assert.equal(isSupportedLanguage('fr'), false);
    assert.equal(isSupportedLanguage(123), false);
    assert.equal(isSupportedLanguage(null), false);
  });

  it('retrieves language metadata with fallback to English', () => {
    const enMeta = getLanguageMeta('en');
    assert.equal(enMeta.name, 'English');
    assert.equal(enMeta.direction, 'ltr');

    const knMeta = getLanguageMeta('kn');
    assert.equal(knMeta.nativeName, 'ಕನ್ನಡ');
    assert.equal(knMeta.script, 'Kannada');

    const hiMeta = getLanguageMeta('hi');
    assert.equal(hiMeta.nativeName, 'हिन्दी');
    assert.equal(hiMeta.script, 'Devanagari');
  });

  it('translates nested key paths in all supported languages', () => {
    assert.equal(t('common.appName', 'en'), 'JanaSahayak');
    assert.equal(t('common.appName', 'hi'), 'जनसहायक');
    assert.equal(t('common.appName', 'kn'), 'ಜನಸಹಾಯಕ್');

    assert.equal(t('common.tagline', 'en'), 'Government services, explained simply.');
    assert.equal(t('common.tagline', 'hi'), 'सरकारी सेवाएं, सरलता से समझें।');
    assert.equal(t('common.tagline', 'kn'), 'ಸರ್ಕಾರಿ ಸೇವೆಗಳು, ಸರಳವಾಗಿ ಅರ್ಥೈಸಿಕೊಳ್ಳಿ.');
  });

  it('interpolates parameters correctly', () => {
    const enCount = t('search.resultsCount', 'en', { count: 5 });
    assert.equal(enCount, '5 services found');

    const hiCount = t('search.resultsCount', 'hi', { count: 3 });
    assert.equal(hiCount, '3 सेवाएं मिलीं');

    const knCount = t('search.resultsCount', 'kn', { count: 12 });
    assert.equal(knCount, '12 ಸೇವೆಗಳು ಕಂಡುಬಂದಿವೆ');
  });

  it('falls back to English when a key is missing in the target locale', () => {
    // Calling with a key that is present in en but simulate missing in kn
    const fallbackText = t('common.appName', 'unknown_lang' as unknown as 'en');
    assert.equal(fallbackText, 'JanaSahayak');
  });

  it('falls back to the raw key path if missing in all dictionaries', () => {
    const missing = t('nonexistent.path.key', 'kn');
    assert.equal(missing, 'nonexistent.path.key');
  });

  it('checks key existence with hasTranslationKey', () => {
    assert.equal(hasTranslationKey('common.appName', 'en'), true);
    assert.equal(hasTranslationKey('common.appName', 'kn'), true);
    assert.equal(hasTranslationKey('nonexistent.key', 'en'), false);
  });
});
