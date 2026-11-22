import type {
  AIAssistResult,
  LLMProvider,
  PublicServiceDetail,
  SearchInterpretationResult,
  SupportedLanguage,
} from '@janasahayak/types';
import { ContextBuilder } from './context-builder.js';
import { IntentClassifier } from './intent-classifier.js';
import { OutputValidator } from './output-validator.js';
import { PIIGuard } from './pii-guard.js';
import { CONSERVATIVE_REFUSAL_MESSAGES, PromptPolicy } from './prompt-policy.js';
import { MockLLMProvider } from './provider.js';

export interface RAGServiceOptions {
  provider?: LLMProvider;
}

export interface AssistInput {
  message: string;
  language?: SupportedLanguage;
  service?: PublicServiceDetail | null;
}

export class RAGService {
  private readonly provider: LLMProvider;

  constructor(options: RAGServiceOptions = {}) {
    this.provider = options.provider ?? new MockLLMProvider();
  }

  /**
   * Interprets a user query for search: redacts PII, classifies intent, and suggests questions.
   */
  public interpretSearch(
    query: string,
    language: SupportedLanguage = 'en',
    availableServices: PublicServiceDetail[] = [],
  ): SearchInterpretationResult {
    // 1. PII & Prompt-Injection Guard
    const piiResult = PIIGuard.sanitize(query);

    // 2. Intent Classification
    const intentResult = IntentClassifier.classify(piiResult.sanitizedText, language);

    // 3. Match Available Services based on intent & keywords
    const matches = availableServices
      .filter((s) => {
        if (intentResult.intent === 'SCHOLARSHIP_DISCOVERY') {
          return s.service.serviceType === 'SCHOLARSHIP' || s.service.serviceType === 'SCHEME';
        }
        if (intentResult.intent === 'SENIOR_CITIZEN_SUPPORT') {
          return (
            s.service.slug.includes('senior') || s.service.title.toLowerCase().includes('senior')
          );
        }
        if (intentResult.intent === 'DOCUMENT_GUIDANCE') {
          return s.documents.length > 0;
        }
        return true;
      })
      .map((s) => ({
        id: s.service.id,
        slug: s.service.slug,
        title:
          (typeof s.version?.content?.title === 'string' ? s.version.content.title : null) ??
          s.service.title,
        summary:
          (typeof s.version?.content?.overview === 'string' ? s.version.content.overview : null) ??
          s.service.shortDescription,
        confidence: intentResult.confidence,
        verification: {
          status: s.sources[0]?.verificationStatus ?? 'VERIFIED',
          lastVerifiedAt: s.sources[0]?.lastVerifiedAt ?? s.service.updatedAt,
        },
      }));

    return {
      intent: intentResult.intent,
      confidence: intentResult.confidence,
      suggestedQuestions: intentResult.suggestedQuestions,
      matches,
      sanitizedQuery: piiResult.sanitizedText,
      piiDetected: piiResult.hasPII,
    };
  }

  /**
   * Executes the full grounded AI Assistant RAG pipeline.
   */
  public async assist(input: AssistInput): Promise<AIAssistResult> {
    const language: SupportedLanguage = input.language ?? 'en';

    // 1. PII and Prompt-Injection Guard
    const piiResult = PIIGuard.sanitize(input.message);

    // If suspicious prompt-injection attempt detected, immediately return conservative refusal
    if (piiResult.isSuspicious) {
      return {
        answer: CONSERVATIVE_REFUSAL_MESSAGES[language],
        sources: [],
        refusal: true,
        suggestedActions: ['Check official government portal'],
      };
    }

    // 2. Context Building from Verified Records
    const ragContext = ContextBuilder.buildContext({
      service: input.service,
      language,
    });

    // If no verified context was found, refuse conservatively without calling LLM
    if (ragContext.facts.length === 0) {
      return {
        answer: CONSERVATIVE_REFUSAL_MESSAGES[language],
        sources: [],
        refusal: true,
        suggestedActions: ['Search public services catalogue', 'Verify on state government portal'],
      };
    }

    // 3. Assemble Prompt with Strict Policy
    const systemPrompt = PromptPolicy.getSystemPrompt(language);
    const userPrompt = PromptPolicy.buildUserPrompt(
      piiResult.sanitizedText,
      ragContext.formattedContext,
    );

    // 4. LLM Generation
    const citations = ragContext.sources.map((s) => ({
      serviceId: s.serviceId,
      sourceId: s.sourceId,
      sourceUrl: s.sourceUrl,
      verificationStatus: s.verificationStatus,
      contentVersion: 1,
    }));

    const response = await this.provider.generate({
      systemPrompt,
      userPrompt,
      language,
      maxTokens: 500,
      contextCitations: citations,
    });

    // 5. Output Validation (anti-guarantee, anti-credential, approved URLs)
    const validation = OutputValidator.validate(response.text, ragContext.sources);

    if (!validation.isValid) {
      // Fallback to grounded conservative answer on validation failure
      const fallbackUrl = ragContext.sources[0]?.sourceUrl ?? 'https://karnataka.gov.in';
      return {
        answer: `This service is administered by the government. Please check the official portal at ${fallbackUrl} for verified instructions.`,
        sources: ragContext.sources,
        refusal: false,
        suggestedActions: ['View verified official portal'],
        model: response.model,
      };
    }

    const isRefusal = response.text.trim() === CONSERVATIVE_REFUSAL_MESSAGES[language].trim();

    return {
      answer: validation.sanitizedText,
      sources: ragContext.sources,
      refusal: isRefusal,
      suggestedActions: [
        'Check eligibility criteria',
        'Review document checklist',
        'Follow application journey',
      ],
      model: response.model,
    };
  }
}
