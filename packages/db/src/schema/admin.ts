import type {
  AuditLogRecord,
  ContentReviewRecord,
  ContentStatus,
  ServiceRecord,
  ServiceSourceRecord,
  ServiceVersionRecord,
  SupportedLanguage,
  VerificationStatus,
} from '@janasahayak/types';
import type {
  CreateServiceInput,
  CreateServiceSourceInput,
  CreateServiceVersionInput,
  UpdateServiceInput,
} from '@janasahayak/validation';
import type { Queryable } from '../client.js';
import { mapServiceRow } from './services.js';

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

export function mapServiceVersionRow(row: Record<string, unknown>): ServiceVersionRecord {
  return {
    id: String(row.id),
    serviceId: String(row.service_id),
    versionNumber: Number(row.version_number),
    content: (row.content as Record<string, unknown>) ?? {},
    language: (row.language as SupportedLanguage) ?? 'en',
    effectiveFrom: row.effective_from ? String(row.effective_from) : null,
    effectiveTo: row.effective_to ? String(row.effective_to) : null,
    createdBy: String(row.created_by),
    approvedBy: row.approved_by ? String(row.approved_by) : null,
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export function mapServiceSourceRow(row: Record<string, unknown>): ServiceSourceRecord {
  return {
    id: String(row.id),
    serviceId: String(row.service_id),
    sourceUrl: String(row.source_url),
    sourceType: String(row.source_type),
    publisher: String(row.publisher),
    retrievedAt: (row.retrieved_at as Date).toISOString(),
    lastVerifiedAt: (row.last_verified_at as Date).toISOString(),
    verificationStatus: row.verification_status as VerificationStatus,
    reviewNotes: row.review_notes ? String(row.review_notes) : null,
  };
}

export async function getServiceById(client: Queryable, id: string): Promise<ServiceRecord | null> {
  const result = await client.query(
    `SELECT id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at
     FROM service_records
     WHERE id = $1`,
    [id],
  );

  const row = (result.rows[0] as RawServiceRow | undefined) ?? null;
  return row ? mapServiceRow(row) : null;
}

export async function createServiceDraft(
  client: Queryable,
  input: CreateServiceInput,
): Promise<ServiceRecord> {
  const result = await client.query(
    `INSERT INTO service_records (slug, service_type, title, short_description, department_name, state_code, status)
     VALUES ($1, $2, $3, $4, $5, $6, 'DRAFT')
     RETURNING id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at`,
    [
      input.slug,
      input.serviceType,
      input.title,
      input.shortDescription,
      input.departmentName,
      input.stateCode ?? null,
    ],
  );

  return mapServiceRow(result.rows[0] as RawServiceRow);
}

export async function updateService(
  client: Queryable,
  id: string,
  input: UpdateServiceInput,
): Promise<ServiceRecord | null> {
  const setClauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (input.slug !== undefined) {
    setClauses.push(`slug = $${paramIdx++}`);
    values.push(input.slug);
  }
  if (input.serviceType !== undefined) {
    setClauses.push(`service_type = $${paramIdx++}`);
    values.push(input.serviceType);
  }
  if (input.title !== undefined) {
    setClauses.push(`title = $${paramIdx++}`);
    values.push(input.title);
  }
  if (input.shortDescription !== undefined) {
    setClauses.push(`short_description = $${paramIdx++}`);
    values.push(input.shortDescription);
  }
  if (input.departmentName !== undefined) {
    setClauses.push(`department_name = $${paramIdx++}`);
    values.push(input.departmentName);
  }
  if (input.stateCode !== undefined) {
    setClauses.push(`state_code = $${paramIdx++}`);
    values.push(input.stateCode);
  }

  if (setClauses.length === 0) {
    return getServiceById(client, id);
  }

  setClauses.push(`updated_at = NOW()`);
  values.push(id);

  const query = `
    UPDATE service_records
    SET ${setClauses.join(', ')}
    WHERE id = $${paramIdx}
    RETURNING id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at
  `;

  const result = await client.query(query, values);
  const row = (result.rows[0] as RawServiceRow | undefined) ?? null;
  return row ? mapServiceRow(row) : null;
}

export async function createServiceVersion(
  client: Queryable,
  serviceId: string,
  input: CreateServiceVersionInput,
  createdBy: string,
): Promise<ServiceVersionRecord> {
  const nextVerRes = await client.query(
    `SELECT COALESCE(MAX(version_number), 0) + 1 AS next_ver
     FROM service_versions
     WHERE service_id = $1`,
    [serviceId],
  );
  const nextVersionNumber = Number((nextVerRes.rows[0] as { next_ver: number | string }).next_ver);

  const result = await client.query(
    `INSERT INTO service_versions (service_id, version_number, content, language, effective_from, effective_to, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id, service_id, version_number, content, language, effective_from, effective_to, created_by, approved_by, created_at`,
    [
      serviceId,
      nextVersionNumber,
      JSON.stringify(input.content),
      input.language,
      input.effectiveFrom ?? null,
      input.effectiveTo ?? null,
      createdBy,
    ],
  );

  return mapServiceVersionRow(result.rows[0] as Record<string, unknown>);
}

export async function addServiceSource(
  client: Queryable,
  serviceId: string,
  input: CreateServiceSourceInput,
): Promise<ServiceSourceRecord> {
  const result = await client.query(
    `INSERT INTO service_sources (service_id, source_url, source_type, publisher, verification_status, review_notes)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, service_id, source_url, source_type, publisher, retrieved_at, last_verified_at, verification_status, review_notes`,
    [
      serviceId,
      input.sourceUrl,
      input.sourceType,
      input.publisher,
      input.verificationStatus,
      input.reviewNotes ?? null,
    ],
  );

  return mapServiceSourceRow(result.rows[0] as Record<string, unknown>);
}

export async function transitionServiceStatus(
  client: Queryable,
  serviceId: string,
  targetStatus: ContentStatus,
): Promise<ServiceRecord | null> {
  const result = await client.query(
    `UPDATE service_records
     SET status = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at`,
    [serviceId, targetStatus],
  );

  const row = (result.rows[0] as RawServiceRow | undefined) ?? null;
  return row ? mapServiceRow(row) : null;
}

export async function publishService(
  client: Queryable,
  serviceId: string,
  approvedBy: string,
  versionId?: string,
): Promise<ServiceRecord | null> {
  let targetVersionId = versionId;

  if (!targetVersionId) {
    const latestVerRes = await client.query(
      `SELECT id FROM service_versions
       WHERE service_id = $1
       ORDER BY version_number DESC
       LIMIT 1`,
      [serviceId],
    );
    const rawV = latestVerRes.rows[0] as { id: string } | undefined;
    targetVersionId = rawV?.id;
  }

  if (targetVersionId) {
    await client.query(
      `UPDATE service_versions
       SET approved_by = $2
       WHERE id = $1`,
      [targetVersionId, approvedBy],
    );
  }

  const result = await client.query(
    `UPDATE service_records
     SET status = 'PUBLISHED', current_version_id = $2, updated_at = NOW()
     WHERE id = $1
     RETURNING id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at`,
    [serviceId, targetVersionId ?? null],
  );

  const row = (result.rows[0] as RawServiceRow | undefined) ?? null;
  return row ? mapServiceRow(row) : null;
}

export async function deprecateService(
  client: Queryable,
  serviceId: string,
): Promise<ServiceRecord | null> {
  const result = await client.query(
    `UPDATE service_records
     SET status = 'DEPRECATED', updated_at = NOW()
     WHERE id = $1
     RETURNING id, slug, service_type, title, short_description, department_name, state_code, status, current_version_id, created_at, updated_at`,
    [serviceId],
  );

  const row = (result.rows[0] as RawServiceRow | undefined) ?? null;
  return row ? mapServiceRow(row) : null;
}

export interface ServiceHistoryBundle {
  versions: ServiceVersionRecord[];
  reviews: ContentReviewRecord[];
}

export async function getServiceHistory(
  client: Queryable,
  serviceId: string,
): Promise<ServiceHistoryBundle> {
  const versionsRes = await client.query(
    `SELECT id, service_id, version_number, content, language, effective_from, effective_to, created_by, approved_by, created_at
     FROM service_versions
     WHERE service_id = $1
     ORDER BY version_number DESC`,
    [serviceId],
  );

  const reviewsRes = await client.query(
    `SELECT id, service_id, reviewer_id, decision, notes, reviewed_at
     FROM content_reviews
     WHERE service_id = $1
     ORDER BY reviewed_at DESC`,
    [serviceId],
  );

  const versions = (versionsRes.rows as Record<string, unknown>[]).map(mapServiceVersionRow);
  const reviews: ContentReviewRecord[] = (reviewsRes.rows as Record<string, unknown>[]).map(
    (row) => ({
      id: String(row.id),
      serviceId: String(row.service_id),
      reviewerId: row.reviewer_id ? String(row.reviewer_id) : null,
      decision: row.decision as ContentReviewRecord['decision'],
      notes: row.notes ? String(row.notes) : null,
      reviewedAt: (row.reviewed_at as Date).toISOString(),
    }),
  );

  return { versions, reviews };
}

export interface QueryAuditLogsOptions {
  actorId?: string | undefined;
  resourceType?: string | undefined;
  resourceId?: string | undefined;
  limit?: number | undefined;
  offset?: number | undefined;
}

export async function queryAuditLogs(
  client: Queryable,
  options: QueryAuditLogsOptions = {},
): Promise<AuditLogRecord[]> {
  const clauses: string[] = [];
  const values: unknown[] = [];
  let paramIdx = 1;

  if (options.actorId) {
    clauses.push(`actor_id = $${paramIdx++}`);
    values.push(options.actorId);
  }
  if (options.resourceType) {
    clauses.push(`resource_type = $${paramIdx++}`);
    values.push(options.resourceType);
  }
  if (options.resourceId) {
    clauses.push(`resource_id = $${paramIdx++}`);
    values.push(options.resourceId);
  }

  const whereClause = clauses.length > 0 ? `WHERE ${clauses.join(' AND ')}` : '';
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  values.push(limit);
  const limitIdx = paramIdx++;
  values.push(offset);
  const offsetIdx = paramIdx++;

  const query = `
    SELECT id, actor_id, action, resource_type, resource_id, metadata, created_at
    FROM audit_logs
    ${whereClause}
    ORDER BY created_at DESC
    LIMIT $${limitIdx} OFFSET $${offsetIdx}
  `;

  const result = await client.query(query, values);
  return (result.rows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    action: String(row.action),
    resourceType: String(row.resource_type),
    resourceId: row.resource_id ? String(row.resource_id) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: (row.created_at as Date).toISOString(),
  }));
}
