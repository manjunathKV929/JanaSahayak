import type {
  BhashiniPipelineConfig,
  SupportedLanguage,
  TranslationProvider,
  TranslationRequest,
  TranslationResponse,
} from '@janasahayak/types';
import { assertNumericPreservation, validateNumericPreservation } from './numeric-guard.js';

/**
 * Curated knowledge base for authentic civic & scheme terminology in Karnataka and India.
 */
const CIVIC_TRANSLATION_MAP: Record<string, Partial<Record<SupportedLanguage, string>>> = {
  'income certificate': {
    hi: 'आय प्रमाण पत्र',
    kn: 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ',
  },
  'caste certificate': {
    hi: 'जाति प्रमाण पत्र',
    kn: 'ಜಾತಿ ಪ್ರಮಾಣಪತ್ರ',
  },
  'domicile certificate': {
    hi: 'मूल निवास प्रमाण पत्र',
    kn: 'ಕರ್ನಾಟಕ ವಾಸಸ್ಥಳ ಪ್ರಮಾಣಪತ್ರ',
  },
  'age proof': {
    hi: 'आयु प्रमाण पत्र',
    kn: 'ವಯಸ್ಸಿನ ಪುರಾವೆ ದಾಖಲೆ',
  },
  'post-matric scholarship': {
    hi: 'पोस्ट-मैट्रिक छात्रवृत्ति',
    kn: 'ಪೋಸ್ಟ್-ಮೆಟ್ರಿಕ್ ವಿದ್ಯಾರ್ಥಿವೇತನ',
  },
  'senior citizen card': {
    hi: 'वरिष्ठ नागरिक पहचान पत्र',
    kn: 'ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿ',
  },
  'annual family income must be below ₹2,50,000': {
    hi: 'वार्षिक पारिवारिक आय ₹2,50,000 से कम होनी चाहिए',
    kn: 'ವಾರ್ಷಿಕ ಕುಟುಂಬದ ಆದಾಯ ₹2,50,000 ಕ್ಕಿಂತ ಕಡಿಮೆ ಇರಬೇಕು',
  },
  'applicant must be aged 60 years or above': {
    hi: 'आवेदक की आयु 60 वर्ष या उससे अधिक होनी चाहिए',
    kn: 'ಅರ್ಜಿದಾರರು 60 ವರ್ಷ ಅಥವಾ ಅದಕ್ಕಿಂತ ಹೆಚ್ಚಿನ ವಯಸ್ಸಿನವರಾಗಿರಬೇಕು',
  },
  'must be a permanent resident of karnataka': {
    hi: 'कर्नाटक का स्थायी निवासी होना चाहिए',
    kn: 'ಕರ್ನಾಟಕದ ಖಾಯಂ ನಿವಾಸಿಯಾಗಿರಬೇಕು',
  },
  'minimum 50% marks in previous examination': {
    hi: 'पिछली परीक्षा में न्यूनतम 50% अंक अनिवार्य',
    kn: 'ಹಿಂದಿನ ಪರೀಕ್ಷೆಯಲ್ಲಿ ಕನಿಷ್ಠ 50% ಅಂಕಗಳು ಕಡ್ಡಾಯ',
  },
};

/**
 * Mock Bhashini translation provider for deterministic testing and local development.
 */
export class MockBhashiniProvider implements TranslationProvider {
  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, sourceLanguage = 'en', targetLanguage, preserveNumbers = true } = request;

    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        provider: 'mock',
        preservedNumbers: true,
      };
    }

    const lower = text.trim().toLowerCase();
    const curatedMatch = CIVIC_TRANSLATION_MAP[lower]?.[targetLanguage];

    let translatedText: string;
    if (curatedMatch) {
      translatedText = curatedMatch;
    } else {
      // Deterministic synthetic translation that preserves numbers and format
      if (targetLanguage === 'hi') {
        translatedText = `[अनुवाद: ${text}]`;
      } else if (targetLanguage === 'kn') {
        translatedText = `[ಅನುವಾದ: ${text}]`;
      } else {
        translatedText = text;
      }
    }

    // Verify numeric preservation rule
    let preservedNumbers = true;
    if (preserveNumbers) {
      const numCheck = validateNumericPreservation(text, translatedText);
      if (!numCheck.isValid) {
        preservedNumbers = false;
        // Strict guard: If translation failed to preserve numeric values, fail
        assertNumericPreservation(text, translatedText);
      }
    }

    return {
      translatedText,
      sourceLanguage,
      targetLanguage,
      provider: 'mock',
      preservedNumbers,
    };
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    return Promise.all(requests.map((req) => this.translate(req)));
  }
}

/**
 * Unified Bhashini AI Translation Service implementing Bhashini ULCA Pipeline API v2.
 */
export class BhashiniService implements TranslationProvider {
  private readonly mockProvider: MockBhashiniProvider;
  private readonly config: BhashiniPipelineConfig;
  private readonly cache = new Map<string, string>();

  constructor(config: BhashiniPipelineConfig = {}) {
    this.config = {
      enableNumericPreservation: true,
      useMock: process.env.NODE_ENV !== 'production' || !config.inferenceApiKey,
      ...config,
    };
    this.mockProvider = new MockBhashiniProvider();
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse> {
    const { text, sourceLanguage = 'en', targetLanguage, preserveNumbers = true } = request;

    if (sourceLanguage === targetLanguage) {
      return {
        translatedText: text,
        sourceLanguage,
        targetLanguage,
        provider: 'mock',
        preservedNumbers: true,
      };
    }

    // Check in-memory cache
    const cacheKey = `${sourceLanguage}:${targetLanguage}:${text}`;
    const cached = this.cache.get(cacheKey);
    if (cached !== undefined) {
      return {
        translatedText: cached,
        sourceLanguage,
        targetLanguage,
        provider: 'bhashini',
        cached: true,
        preservedNumbers: true,
      };
    }

    // Use mock provider in dev/test or when API key is unset
    if (this.config.useMock || !this.config.inferenceApiKey) {
      const result = await this.mockProvider.translate(request);
      this.cache.set(cacheKey, result.translatedText);
      return result;
    }

    try {
      // Live Bhashini ULCA pipeline request
      const endpoint =
        this.config.pipelineEndpoint ??
        'https://dhruva-api.bhashini.gov.in/services/inference/pipeline';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: this.config.inferenceApiKey,
          ...(this.config.userId ? { 'User-ID': this.config.userId } : {}),
        },
        body: JSON.stringify({
          pipelineTasks: [
            {
              taskType: 'translation',
              config: {
                language: {
                  sourceLanguage,
                  targetLanguage,
                },
              },
            },
          ],
          inputData: {
            input: [{ source: text }],
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`Bhashini API responded with status ${response.status}`);
      }

      const json = (await response.json()) as {
        pipelineResponse?: Array<{
          output?: Array<{ target: string }>;
        }>;
      };

      const translated = json.pipelineResponse?.[0]?.output?.[0]?.target ?? text;

      if (preserveNumbers && this.config.enableNumericPreservation) {
        assertNumericPreservation(text, translated);
      }

      this.cache.set(cacheKey, translated);

      return {
        translatedText: translated,
        sourceLanguage,
        targetLanguage,
        provider: 'bhashini',
        preservedNumbers: true,
      };
    } catch {
      // Fallback safely to mock provider
      const fallbackResult = await this.mockProvider.translate(request);
      this.cache.set(cacheKey, fallbackResult.translatedText);
      return {
        ...fallbackResult,
        provider: 'fallback',
      };
    }
  }

  async translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]> {
    return Promise.all(requests.map((req) => this.translate(req)));
  }
}
