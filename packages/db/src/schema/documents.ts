import type { DocumentIssuerRecord, DocumentRecord } from '@janasahayak/types';
import type { Queryable } from '../client.js';

export interface DocumentWithIssuer {
  document: DocumentRecord;
  issuer: DocumentIssuerRecord | null;
}

export async function findDocumentById(
  client: Queryable,
  id: string,
): Promise<DocumentWithIssuer | null> {
  const result = await client.query(
    `SELECT
       d.id, d.name, d.description, d.document_type, d.issuer_id, d.created_at, d.updated_at,
       di.id AS issuer_pk, di.name AS issuer_name, di.issuer_type AS issuer_category, di.portal_url, di.created_at AS issuer_created_at
     FROM documents d
     LEFT JOIN document_issuers di ON di.id = d.issuer_id
     WHERE d.id = $1`,
    [id],
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const document: DocumentRecord = {
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    documentType: String(row.document_type),
    issuerId: row.issuer_id ? String(row.issuer_id) : null,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };

  const issuer: DocumentIssuerRecord | null = row.issuer_pk
    ? {
        id: String(row.issuer_pk),
        name: String(row.issuer_name),
        issuerType: String(row.issuer_category),
        portalUrl: row.portal_url ? String(row.portal_url) : null,
        createdAt: (row.issuer_created_at as Date).toISOString(),
      }
    : null;

  return { document, issuer };
}

export interface ServiceDocumentEntry extends DocumentRecord {
  isRequired: boolean;
  conditions: Record<string, unknown> | null;
  displayOrder: number;
}

export async function getDocumentsForService(
  client: Queryable,
  serviceId: string,
): Promise<ServiceDocumentEntry[]> {
  const result = await client.query(
    `SELECT
       d.id, d.name, d.description, d.document_type, d.issuer_id, d.created_at, d.updated_at,
       sd.is_required, sd.conditions, sd.display_order
     FROM service_documents sd
     JOIN documents d ON d.id = sd.document_id
     WHERE sd.service_id = $1
     ORDER BY sd.display_order ASC`,
    [serviceId],
  );

  return (result.rows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    name: String(row.name),
    description: String(row.description),
    documentType: String(row.document_type),
    issuerId: row.issuer_id ? String(row.issuer_id) : null,
    isRequired: Boolean(row.is_required),
    conditions: (row.conditions as Record<string, unknown>) ?? null,
    displayOrder: Number(row.display_order),
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  }));
}
