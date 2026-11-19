import { redactSensitiveObject } from '@janasahayak/config';
import type { AuditLogRecord } from '@janasahayak/types';
import type { Queryable } from '../client.js';

export interface NewAuditLogEntry {
  actorId?: string | null | undefined;
  action: string;
  resourceType: string;
  resourceId?: string | null | undefined;
  metadata?: Record<string, unknown> | undefined;
}

export async function recordAuditLog(
  client: Queryable,
  entry: NewAuditLogEntry,
): Promise<AuditLogRecord> {
  const sanitizedMetadata = redactSensitiveObject(entry.metadata ?? {}) as Record<string, unknown>;

  const result = await client.query(
    `INSERT INTO audit_logs (actor_id, action, resource_type, resource_id, metadata)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id, actor_id, action, resource_type, resource_id, metadata, created_at`,
    [
      entry.actorId ?? null,
      entry.action,
      entry.resourceType,
      entry.resourceId ?? null,
      JSON.stringify(sanitizedMetadata),
    ],
  );

  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    actorId: row.actor_id ? String(row.actor_id) : null,
    action: String(row.action),
    resourceType: String(row.resource_type),
    resourceId: row.resource_id ? String(row.resource_id) : null,
    metadata: (row.metadata as Record<string, unknown>) ?? {},
    createdAt: (row.created_at as Date).toISOString(),
  };
}

export async function findAuditLogsByResource(
  client: Queryable,
  resourceType: string,
  resourceId: string,
): Promise<AuditLogRecord[]> {
  const result = await client.query(
    `SELECT id, actor_id, action, resource_type, resource_id, metadata, created_at
     FROM audit_logs
     WHERE resource_type = $1 AND resource_id = $2
     ORDER BY created_at DESC`,
    [resourceType, resourceId],
  );

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
