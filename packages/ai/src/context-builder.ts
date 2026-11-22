import type {
  AIAssistSourceCitation,
  DocumentGuideDetail,
  PublicServiceDetail,
  RAGContext,
  RAGFact,
  SupportedLanguage,
} from '@janasahayak/types';

export interface BuildContextInput {
  service?: PublicServiceDetail | null | undefined;
  documentGuide?: DocumentGuideDetail | null | undefined;
  language?: SupportedLanguage | undefined;
}

export class ContextBuilder {
  /**
   * Constructs strict, bounded RAG context with source citations.
   */
  public static buildContext(input: BuildContextInput): RAGContext {
    const language = input.language ?? 'en';
    const facts: RAGFact[] = [];
    const sources: AIAssistSourceCitation[] = [];

    if (input.service) {
      const svc = input.service;
      const primarySource = svc.sources[0];
      const sourceId = primarySource?.id ?? 'source-unknown';
      const sourceUrl = primarySource?.sourceUrl ?? 'https://karnataka.gov.in';
      const publisher = primarySource?.publisher ?? 'Government of Karnataka';
      const verificationStatus = primarySource?.verificationStatus ?? 'VERIFIED';
      const contentVersion = svc.version?.versionNumber ?? 1;

      if (primarySource) {
        sources.push({
          serviceId: svc.service.id,
          sourceId: primarySource.id,
          sourceUrl: primarySource.sourceUrl,
          publisher: primarySource.publisher,
          verificationStatus: primarySource.verificationStatus,
        });
      }

      // 1. Service Overview & Benefits
      if (svc.version?.content) {
        const c = svc.version.content;
        const title = typeof c.title === 'string' ? c.title : svc.service.title;
        const overview = typeof c.overview === 'string' ? c.overview : svc.service.shortDescription;
        const benefits = typeof c.benefits === 'string' ? c.benefits : '';
        const eligibilitySummary =
          typeof c.eligibilitySummary === 'string' ? c.eligibilitySummary : '';

        facts.push({
          serviceId: svc.service.id,
          serviceSlug: svc.service.slug,
          serviceTitle: title,
          sourceId,
          sourceUrl,
          publisher,
          verificationStatus,
          contentVersion,
          category: 'OVERVIEW',
          text: `Service "${title}" (${svc.service.departmentName}): ${overview}`,
        });

        if (benefits) {
          facts.push({
            serviceId: svc.service.id,
            serviceSlug: svc.service.slug,
            serviceTitle: title,
            sourceId,
            sourceUrl,
            publisher,
            verificationStatus,
            contentVersion,
            category: 'BENEFITS',
            text: `Benefits: ${benefits}`,
          });
        }

        if (eligibilitySummary) {
          facts.push({
            serviceId: svc.service.id,
            serviceSlug: svc.service.slug,
            serviceTitle: title,
            sourceId,
            sourceUrl,
            publisher,
            verificationStatus,
            contentVersion,
            category: 'ELIGIBILITY_SUMMARY',
            text: `Eligibility Criteria: ${eligibilitySummary}`,
          });
        }
      }

      // 2. Deterministic Rules
      for (const rule of svc.rules) {
        const explanationText = rule.explanation[language] ?? rule.explanation['en'] ?? rule.name;
        facts.push({
          serviceId: svc.service.id,
          serviceSlug: svc.service.slug,
          serviceTitle: svc.service.title,
          sourceId,
          sourceUrl,
          publisher,
          verificationStatus,
          contentVersion,
          category: 'RULE',
          text: `Requirement [${rule.name}]: ${explanationText}`,
        });
      }

      // 3. Required Documents
      for (const doc of svc.documents) {
        facts.push({
          serviceId: svc.service.id,
          serviceSlug: svc.service.slug,
          serviceTitle: svc.service.title,
          sourceId,
          sourceUrl,
          publisher,
          verificationStatus,
          contentVersion,
          category: 'DOCUMENT',
          text: `Required Document: ${doc.name} (${doc.description})`,
        });
      }

      // 4. Application Journey Steps
      if (svc.journey?.steps) {
        for (const step of svc.journey.steps) {
          const stepDesc =
            step.description[language] ??
            step.description['en'] ??
            Object.values(step.description)[0] ??
            '';
          facts.push({
            serviceId: svc.service.id,
            serviceSlug: svc.service.slug,
            serviceTitle: svc.service.title,
            sourceId,
            sourceUrl,
            publisher,
            verificationStatus,
            contentVersion,
            category: 'JOURNEY_STEP',
            text: `Step ${step.displayOrder} - ${step.title}: ${stepDesc}`,
          });
        }
      }
    }

    if (input.documentGuide) {
      const g = input.documentGuide;
      const authorityUrl =
        g.guide.issuingAuthority.portalUrl ?? 'https://nadakacheri.karnataka.gov.in';
      sources.push({
        serviceId: g.id,
        sourceId: `source-doc-${g.id}`,
        sourceUrl: authorityUrl,
        publisher: g.guide.issuingAuthority.name,
        verificationStatus: 'VERIFIED',
      });

      const purpose = g.guide.purpose[language] ?? g.guide.purpose['en'] ?? '';
      const fees = g.guide.fees[language] ?? g.guide.fees['en'] ?? '';
      const validity = g.guide.validityPeriod[language] ?? g.guide.validityPeriod['en'] ?? '';

      facts.push({
        serviceId: g.id,
        serviceSlug: g.id,
        serviceTitle: g.name,
        sourceId: `source-doc-${g.id}`,
        sourceUrl: authorityUrl,
        publisher: g.guide.issuingAuthority.name,
        verificationStatus: 'VERIFIED',
        contentVersion: 1,
        category: 'DOCUMENT_GUIDE',
        text: `Document Guide for "${g.name}": Purpose: ${purpose}. Issuing Authority: ${g.guide.issuingAuthority.name} (${authorityUrl}). Processing Time: ${g.guide.processingTimeDays} days. Fees: ${fees}. Validity: ${validity}.`,
      });
    }

    // Format bounded evidence block
    const formattedContext =
      facts.length > 0
        ? [
            '=== RETRIEVED VERIFIED OFFICIAL CONTEXT ===',
            ...facts.map(
              (f, i) =>
                `[Fact ${i + 1}] Category: ${f.category ?? 'GENERAL'}\nService: ${f.serviceTitle} (ID: ${f.serviceId})\nSource: ${f.publisher} (${f.sourceUrl})\nDetails: ${f.text}`,
            ),
            '=== END OF CONTEXT ===',
          ].join('\n\n')
        : 'NO_VERIFIED_CONTEXT_FOUND';

    return {
      ...(input.service
        ? { serviceId: input.service.service.id, serviceSlug: input.service.service.slug }
        : {}),
      facts,
      sources,
      formattedContext,
    };
  }
}
