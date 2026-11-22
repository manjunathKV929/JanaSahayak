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

export type UserIntentType =
  | 'SCHOLARSHIP_DISCOVERY'
  | 'DOCUMENT_GUIDANCE'
  | 'SENIOR_CITIZEN_SUPPORT'
  | 'ELIGIBILITY_CHECK'
  | 'GRIEVANCE_HELP'
  | 'GENERAL_INQUIRY'
  | 'OUT_OF_SCOPE';

export interface SearchInterpretationMatch {
  id: string;
  slug: string;
  title: string;
  summary: string;
  confidence: number;
  verification: {
    status: string;
    lastVerifiedAt: string;
  };
}

export interface SearchInterpretationResult {
  intent: UserIntentType;
  confidence: number;
  suggestedQuestions: string[];
  matches: SearchInterpretationMatch[];
  sanitizedQuery: string;
  piiDetected: boolean;
}

export interface AIAssistSourceCitation {
  serviceId: string;
  sourceId: string;
  sourceUrl: string;
  publisher: string;
  verificationStatus: string;
}

export interface AIAssistResult {
  answer: string;
  sources: AIAssistSourceCitation[];
  refusal: boolean;
  suggestedActions: string[];
  model?: string;
}

export interface PIIGuardResult {
  sanitizedText: string;
  hasPII: boolean;
  redactions: string[];
  isSuspicious: boolean;
  reason?: string;
}

export interface RAGFact {
  serviceId: string;
  serviceSlug: string;
  serviceTitle: string;
  sourceId: string;
  sourceUrl: string;
  publisher: string;
  verificationStatus: string;
  contentVersion: number;
  text: string;
  category?: string;
}

export interface RAGContext {
  serviceId?: string | undefined;
  serviceSlug?: string | undefined;
  facts: RAGFact[];
  sources: AIAssistSourceCitation[];
  formattedContext: string;
}
