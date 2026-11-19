import type {
  ContentStatus,
  DeterministicRuleExpression,
  DocumentRecord,
  EligibilityRuleRecord,
  JourneyRecord,
  ServiceRecord,
  ServiceSourceRecord,
  ServiceVersionRecord,
  SupportedLanguage,
  VerificationStatus,
} from '@janasahayak/types';
import type { Queryable } from '../client.js';

interface RawServiceRow {
  id: string;
  slug: string;
  service_type: string;
  title: string;
  short_description: string;
  department_name: string;
  state_code: string | null;
  status: ContentStatus;
  current_version_id: string | null;
  created_at: Date;
  updated_at: Date;
}

export function mapServiceRow(row: RawServiceRow): ServiceRecord {
  return {
    id: row.id,
    slug: row.slug,
    serviceType: row.service_type,
    title: row.title,
    shortDescription: row.short_description,
    departmentName: row.department_name,
    stateCode: row.state_code,
    status: row.status,
    currentVersionId: row.current_version_id,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export async function findServiceBySlug(
  client: Queryable,
  slug: string,
): Promise<ServiceRecord | null> {
  const result = await client.query(
    `SELECT id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at
     FROM service_records
     WHERE slug = $1`,
    [slug],
  );

  const row = (result.rows[0] as RawServiceRow | undefined) ?? null;
  return row ? mapServiceRow(row) : null;
}

export async function listPublishedServices(
  client: Queryable,
  options: { limit?: number; stateCode?: string } = {},
): Promise<ServiceRecord[]> {
  const limit = options.limit ?? 20;
  const values: unknown[] = [limit];
  let query = `
    SELECT id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at
    FROM service_records
    WHERE status = 'PUBLISHED'
  `;

  if (options.stateCode) {
    values.push(options.stateCode);
    query += ` AND (state_code = $2 OR state_code IS NULL)`;
  }

  query += ` ORDER BY title ASC LIMIT $1`;

  const result = await client.query(query, values);
  return (result.rows as RawServiceRow[]).map(mapServiceRow);
}

export interface ServiceDetailBundle {
  service: ServiceRecord;
  version: ServiceVersionRecord | null;
  sources: ServiceSourceRecord[];
  documents: DocumentRecord[];
  rules: EligibilityRuleRecord[];
  journey: JourneyRecord | null;
}

export async function getServiceDetail(
  client: Queryable,
  serviceId: string,
): Promise<ServiceDetailBundle | null> {
  const serviceRes = await client.query(
    `SELECT id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at
     FROM service_records
     WHERE id = $1`,
    [serviceId],
  );

  const rawService = (serviceRes.rows[0] as RawServiceRow | undefined) ?? null;
  if (!rawService) return null;
  const service = mapServiceRow(rawService);

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
      version = {
        id: String(rawV.id),
        serviceId: String(rawV.service_id),
        versionNumber: Number(rawV.version_number),
        content: (rawV.content as Record<string, unknown>) ?? {},
        language: (rawV.language as SupportedLanguage) ?? 'en',
        effectiveFrom: rawV.effective_from ? String(rawV.effective_from) : null,
        effectiveTo: rawV.effective_to ? String(rawV.effective_to) : null,
        createdBy: String(rawV.created_by),
        approvedBy: rawV.approved_by ? String(rawV.approved_by) : null,
        createdAt: (rawV.created_at as Date).toISOString(),
      };
    }
  }

  const sourcesRes = await client.query(
    `SELECT id, service_id, source_url, source_type, publisher, retrieved_at, last_verified_at, verification_status, review_notes
     FROM service_sources
     WHERE service_id = $1`,
    [serviceId],
  );
  const sources: ServiceSourceRecord[] = (sourcesRes.rows as Record<string, unknown>[]).map(
    (s) => ({
      id: String(s.id),
      serviceId: String(s.service_id),
      sourceUrl: String(s.source_url),
      sourceType: String(s.source_type),
      publisher: String(s.publisher),
      retrievedAt: (s.retrieved_at as Date).toISOString(),
      lastVerifiedAt: (s.last_verified_at as Date).toISOString(),
      verificationStatus: s.verification_status as VerificationStatus,
      reviewNotes: s.review_notes ? String(s.review_notes) : null,
    }),
  );

  const docsRes = await client.query(
    `SELECT d.id, d.name, d.description, d.document_type, d.issuer_id, d.created_at, d.updated_at
     FROM service_documents sd
     JOIN documents d ON d.id = sd.document_id
     WHERE sd.service_id = $1
     ORDER BY sd.display_order ASC`,
    [serviceId],
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

  const rulesRes = await client.query(
    `SELECT id, service_id, name, rule_expression, explanation, priority, created_at, updated_at
     FROM eligibility_rules
     WHERE service_id = $1
     ORDER BY priority ASC`,
    [serviceId],
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

  const journeyRes = await client.query(
    `SELECT id, service_id, title, description, version, created_at, updated_at
     FROM journeys
     WHERE service_id = $1
     ORDER BY version DESC
     LIMIT 1`,
    [serviceId],
  );
  const rawJ = journeyRes.rows[0] as Record<string, unknown> | undefined;
  const journey: JourneyRecord | null = rawJ
    ? {
        id: String(rawJ.id),
        serviceId: String(rawJ.service_id),
        title: String(rawJ.title),
        description: String(rawJ.description),
        version: Number(rawJ.version),
        createdAt: (rawJ.created_at as Date).toISOString(),
        updatedAt: (rawJ.updated_at as Date).toISOString(),
      }
    : null;

  return { service, version, sources, documents, rules, journey };
}
