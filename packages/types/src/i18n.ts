import type { SupportedLanguage } from './domain.js';

export interface LanguageMeta {
  code: SupportedLanguage;
  name: string;
  nativeName: string;
  script: string;
  fontFamily: string;
  direction: 'ltr';
}

export interface TranslationRequest {
  text: string;
  sourceLanguage?: SupportedLanguage | undefined;
  targetLanguage: SupportedLanguage;
  preserveNumbers?: boolean | undefined;
}

export interface TranslationResponse {
  translatedText: string;
  sourceLanguage: SupportedLanguage;
  targetLanguage: SupportedLanguage;
  provider: 'bhashini' | 'mock' | 'fallback';
  cached?: boolean | undefined;
  preservedNumbers?: boolean | undefined;
}

export interface NumericPreservationResult {
  isValid: boolean;
  sourceNumbers: string[];
  targetNumbers: string[];
  missingNumbers: string[];
}

export interface TranslationProvider {
  translate(request: TranslationRequest): Promise<TranslationResponse>;
  translateBatch(requests: TranslationRequest[]): Promise<TranslationResponse[]>;
}

export interface BhashiniPipelineConfig {
  pipelineEndpoint?: string | undefined;
  inferenceApiKey?: string | undefined;
  userId?: string | undefined;
  enableNumericPreservation?: boolean | undefined;
  useMock?: boolean | undefined;
}
