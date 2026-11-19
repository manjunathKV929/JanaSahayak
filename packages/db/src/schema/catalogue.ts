import type {
  CatalogueCategory,
  DeadlineRecord,
  DeterministicRuleExpression,
  DocumentRecord,
  EligibilityRuleRecord,
  JourneyRecord,
  JourneyStepRecord,
  PublicServiceDetail,
  PublicServiceSource,
  PublicServiceSummary,
  ServiceRecord,
  ServiceVersionRecord,
  SupportedLanguage,
  VerificationStatus,
} from '@janasahayak/types';
import type { Queryable } from '../client.js';
import { mapServiceVersionRow } from './admin.js';
import { mapServiceRow } from './services.js';

export interface SearchServicesOptions {
  q?: string | undefined;
  category?: string | undefined;
  state?: string | undefined;
  language?: SupportedLanguage | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export interface SearchServicesResult {
  services: PublicServiceSummary[];
  total: number;
  hasMore: boolean;
}

interface RawPublicServiceSummaryRow {
  id: string;
  slug: string;
  service_type: string;
  title: string;
  short_description: string;
  department_name: string;
  state_code: string | null;
  verification_status: VerificationStatus | null;
  last_verified_at: Date | null;
  updated_at: Date;
}

export async function searchPublishedServices(
  client: Queryable,
  options: SearchServicesOptions = {},
): Promise<SearchServicesResult> {
  const clauses: string[] = ["sr.status = 'PUBLISHED'"];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (options.q && options.q.trim().length > 0) {
    const searchTerm = `%${options.q.trim()}%`;
    clauses.push(`(sr.title ILIKE $${paramIdx} OR sr.short_description ILIKE $${paramIdx})`);
    values.push(searchTerm);
    paramIdx++;
  }

  if (options.category && options.category.trim().length > 0) {
    clauses.push(`sr.service_type = $${paramIdx++}`);
    values.push(options.category.trim());
  }

  if (options.state && options.state.trim().length > 0) {
    clauses.push(`(sr.state_code = $${paramIdx} OR sr.state_code IS NULL)`);
    values.push(options.state.trim().toUpperCase());
    paramIdx++;
  }

  const whereClause = clauses.join(' AND ');
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // 1. Total count query
  const countQuery = `
    SELECT COUNT(*) AS total
    FROM service_records sr
    WHERE ${whereClause}
  `;
  const countRes = await client.query(countQuery, values);
  const total = Number((countRes.rows[0] as { total: number | string })?.total ?? 0);

  // 2. Data query with latest source verification metadata
  values.push(limit);
  const limitIdx = paramIdx++;
  values.push(offset);
  const offsetIdx = paramIdx++;

  const dataQuery = `
    SELECT
      sr.id,
      sr.slug,
      sr.service_type,
      sr.title,
      sr.short_description,
      sr.department_name,
      sr.state_code,
      sr.updated_at,
      src.verification_status,
      src.last_verified_at
    FROM service_records sr
    LEFT JOIN LATERAL (
      SELECT verification_status, last_verified_at
      FROM service_sources ss
      WHERE ss.service_id = sr.id
      ORDER BY ss.last_verified_at DESC
      LIMIT 1
    ) src ON true
    WHERE ${whereClause}
    ORDER BY sr.title ASC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await client.query(dataQuery, values);
  const services: PublicServiceSummary[] = (result.rows as RawPublicServiceSummaryRow[]).map(
    (row) => ({
      id: String(row.id),
      slug: String(row.slug),
      serviceType: String(row.service_type),
      title: String(row.title),
      shortDescription: String(row.short_description),
      departmentName: String(row.department_name),
      stateCode: row.state_code,
      verification: {
        status: row.verification_status ?? 'UNVERIFIED',
        lastVerifiedAt: (row.last_verified_at ?? row.updated_at).toISOString(),
      },
    }),
  );

  const hasMore = offset + services.length < total;
  return { services, total, hasMore };
}

export async function getPublishedServiceBySlug(
  client: Queryable,
  slug: string,
): Promise<PublicServiceDetail | null> {
  const serviceRes = await client.query(
    `SELECT id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at
     FROM service_records
     WHERE slug = $1 AND status = 'PUBLISHED'`,
    [slug],
  );

  const rawService = serviceRes.rows[0] as Parameters<typeof mapServiceRow>[0] | undefined;
  if (!rawService) {
    return null;
  }
  const service: ServiceRecord = mapServiceRow(rawService);

  // Version
  let version: ServiceVersionRecord | null = null;
  if (service.currentVersionId) {
    const versionRes = await client.query(
      `SELECT id, service_id, version_number, content, language, effective_from, effective_to, created_by, approved_by, created_at
       FROM service_versions
       WHERE id = $1`,
      [service.currentVersionId],
    );
    const rawV = versionRes.rows[0] as Record<string, unknown> | undefined;
    if (rawV) {
      version = mapServiceVersionRow(rawV);
    }
  }

  // Sources (Public provenance only - never return internal review_notes!)
  const sourcesRes = await client.query(
    `SELECT id, service_id, source_url, source_type, publisher, verification_status, last_verified_at, retrieved_at
     FROM service_sources
     WHERE service_id = $1
     ORDER BY last_verified_at DESC`,
    [service.id],
  );
  const sources: PublicServiceSource[] = (sourcesRes.rows as Record<string, unknown>[]).map(
    (s) => ({
      id: String(s.id),
      serviceId: String(s.service_id),
      sourceUrl: String(s.source_url),
      sourceType: String(s.source_type),
      publisher: String(s.publisher),
      verificationStatus: s.verification_status as VerificationStatus,
      lastVerifiedAt: (s.last_verified_at as Date).toISOString(),
      retrievedAt: (s.retrieved_at as Date).toISOString(),
    }),
  );

  // Required documents
  const docsRes = await client.query(
    `SELECT d.id, d.name, d.description, d.document_type, d.issuer_id, d.created_at, d.updated_at
     FROM service_documents sd
     JOIN documents d ON d.id = sd.document_id
     WHERE sd.service_id = $1
     ORDER BY sd.display_order ASC`,
    [service.id],
  );
  const documents: DocumentRecord[] = (docsRes.rows as Record<string, unknown>[]).map((d) => ({
    id: String(d.id),
    name: String(d.name),
    description: String(d.description),
    documentType: String(d.document_type),
    issuerId: d.issuer_id ? String(d.issuer_id) : null,
    createdAt: (d.created_at as Date).toISOString(),
    updatedAt: (d.updated_at as Date).toISOString(),
  }));

  // Eligibility rules
  const rulesRes = await client.query(
    `SELECT id, service_id, name, rule_expression, explanation, priority, created_at, updated_at
     FROM eligibility_rules
     WHERE service_id = $1
     ORDER BY priority ASC`,
    [service.id],
  );
  const rules: EligibilityRuleRecord[] = (rulesRes.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    serviceId: String(r.service_id),
    name: String(r.name),
    ruleExpression: r.rule_expression as DeterministicRuleExpression,
    explanation: (r.explanation as Record<string, string>) ?? {},
    priority: Number(r.priority),
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }));

  // Journey with Steps
  const journeyRes = await client.query(
    `SELECT id, service_id, title, description, version, created_at, updated_at
     FROM journeys
     WHERE service_id = $1
     ORDER BY version DESC
     LIMIT 1`,
    [service.id],
  );
  const rawJ = journeyRes.rows[0] as Record<string, unknown> | undefined;
  let journey: (JourneyRecord & { steps: JourneyStepRecord[] }) | null = null;

  if (rawJ) {
    const journeyRecord: JourneyRecord = {
      id: String(rawJ.id),
      serviceId: String(rawJ.service_id),
      title: String(rawJ.title),
      description: String(rawJ.description),
      version: Number(rawJ.version),
      createdAt: (rawJ.created_at as Date).toISOString(),
      updatedAt: (rawJ.updated_at as Date).toISOString(),
    };

    const stepsRes = await client.query(
      `SELECT id, journey_id, step_key, title, description, step_type, display_order, official_url, completion_rule
       FROM journey_steps
       WHERE journey_id = $1
       ORDER BY display_order ASC`,
      [journeyRecord.id],
    );

    const steps: JourneyStepRecord[] = (stepsRes.rows as Record<string, unknown>[]).map((s) => ({
      id: String(s.id),
      journeyId: String(s.journey_id),
      stepKey: String(s.step_key),
      title: String(s.title),
      description: (s.description as Record<string, string>) ?? {},
      stepType: String(s.step_type),
      displayOrder: Number(s.display_order),
      officialUrl: s.official_url ? String(s.official_url) : null,
      completionRule: (s.completion_rule as Record<string, unknown>) ?? null,
    }));

    journey = { ...journeyRecord, steps };
  }

  // Deadlines
  const deadlinesRes = await client.query(
    `SELECT id, service_id, name, opens_at, closes_at, source_id, status
     FROM deadlines
     WHERE service_id = $1
     ORDER BY closes_at ASC`,
    [service.id],
  );
  const deadlines: DeadlineRecord[] = (deadlinesRes.rows as Record<string, unknown>[]).map(
    (dl) => ({
      id: String(dl.id),
      serviceId: String(dl.service_id),
      name: String(dl.name),
      opensAt: dl.opens_at ? (dl.opens_at as Date).toISOString() : null,
      closesAt: dl.closes_at ? (dl.closes_at as Date).toISOString() : null,
      sourceId: dl.source_id ? String(dl.source_id) : null,
      status: String(dl.status),
    }),
  );

  return { service, version, sources, documents, rules, journey, deadlines };
}

export async function getPublicServiceSources(
  client: Queryable,
  serviceId: string,
): Promise<PublicServiceSource[]> {
  const result = await client.query(
    `SELECT id, service_id, source_url, source_type, publisher, verification_status, last_verified_at, retrieved_at
     FROM service_sources
     WHERE service_id = $1
     ORDER BY last_verified_at DESC`,
    [serviceId],
  );

  return (result.rows as Record<string, unknown>[]).map((s) => ({
    id: String(s.id),
    serviceId: String(s.service_id),
    sourceUrl: String(s.source_url),
    sourceType: String(s.source_type),
    publisher: String(s.publisher),
    verificationStatus: s.verification_status as VerificationStatus,
    lastVerifiedAt: (s.last_verified_at as Date).toISOString(),
    retrievedAt: (s.retrieved_at as Date).toISOString(),
  }));
}

export async function getCatalogueCategories(client: Queryable): Promise<CatalogueCategory[]> {
  const result = await client.query(
    `SELECT service_type AS category, COUNT(*) AS count
     FROM service_records
     WHERE status = 'PUBLISHED'
     GROUP BY service_type
     ORDER BY count DESC, service_type ASC`,
  );

  return (result.rows as { category: string; count: number | string }[]).map((r) => ({
    category: String(r.category),
    count: Number(r.count),
  }));
}
