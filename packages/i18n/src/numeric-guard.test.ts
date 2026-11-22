import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  NumericPreservationViolationError,
  assertNumericPreservation,
  extractNumbers,
  normalizeIndicNumerals,
  validateNumericPreservation,
} from './numeric-guard.js';

describe('@janasahayak/i18n numeric guard', () => {
  it('normalizes Devanagari numerals to ASCII digits', () => {
    // ०१२३४५६७८९ -> 0123456789
    const devanagari = 'वार्षिक आय ₹२,५०,००० होनी चाहिए';
    const normalized = normalizeIndicNumerals(devanagari);
    assert.equal(normalized, 'वार्षिक आय ₹2,50,000 होनी चाहिए');
  });

  it('normalizes Kannada numerals to ASCII digits', () => {
    // ೦೧೨೩೪೫೬೭೮೯ -> 0123456789
    const kannada = 'ವಯಸ್ಸು ೬೦ ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು';
    const normalized = normalizeIndicNumerals(kannada);
    assert.equal(normalized, 'ವಯಸ್ಸು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚು');
  });

  it('extracts numbers and strips commas accurately', () => {
    const text = 'Annual income below ₹2,50,000 with minimum 50% marks and age 18 to 25.';
    const numbers = extractNumbers(text);
    assert.deepEqual(numbers, ['250000', '50', '18', '25']);
  });

  it('extracts numbers from Indic script text', () => {
    const devanagariText = 'आय ₹२,५०,००० और उम्र ६० वर्ष';
    const numbers = extractNumbers(devanagariText);
    assert.deepEqual(numbers, ['250000', '60']);
  });

  it('validates successful numeric preservation when numbers match', () => {
    const source = 'Annual family income must be below ₹2,50,000 and age 60 years.';
    const translation = 'ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ₹2,50,000 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು ಮತ್ತು ವಯಸ್ಸು 60 ವರ್ಷ.';

    const result = validateNumericPreservation(source, translation);
    assert.equal(result.isValid, true);
    assert.equal(result.missingNumbers.length, 0);
  });

  it('validates successful numeric preservation with Indic numerals', () => {
    const source = 'Applicant age must be 60 years or above.';
    const translationDevanagari = 'आवेदक की आयु ६० वर्ष या उससे अधिक होनी चाहिए।';

    const result = validateNumericPreservation(source, translationDevanagari);
    assert.equal(result.isValid, true);
  });

  it('detects missing numbers and fails validation if translation drops or alters a number', () => {
    const source = 'Annual income must be below ₹2,50,000.';
    // Altered to 1,50,000
    const alteredTranslation = 'वार्षिक आय ₹1,50,000 से कम होनी चाहिए।';

    const result = validateNumericPreservation(source, alteredTranslation);
    assert.equal(result.isValid, false);
    assert.deepEqual(result.missingNumbers, ['250000']);
  });

  it('throws NumericPreservationViolationError on assertNumericPreservation failure', () => {
    const source = 'Income limit is ₹2,50,000 with 50% minimum score.';
    const incompleteTranslation = 'ವಾರ್ಷಿಕ ಆದಾಯದ ಮಿತಿ ₹2,50,000 ಆಗಿದೆ.'; // dropped 50%

    assert.throws(
      () => assertNumericPreservation(source, incompleteTranslation),
      (err) => {
        assert(err instanceof NumericPreservationViolationError);
        assert(err.missingNumbers.includes('50'));
        return true;
      },
    );
  });
});
