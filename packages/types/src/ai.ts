import type { SupportedLanguage } from './domain.js';

export interface LLMContextCitation {
  serviceId: string;
  sourceId: string;
  sourceUrl: string;
  verificationStatus: string;
  contentVersion: number;
}

export interface LLMRequest {
  systemPrompt: string;
  userPrompt: string;
  language: SupportedLanguage;
  maxTokens?: number;
  contextCitations?: LLMContextCitation[];
}

export interface LLMResponse {
  text: string;
  model: string;
  provider: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface LLMProvider {
  generate(input: LLMRequest): Promise<LLMResponse>;
}
