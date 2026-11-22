import type {
  DocumentGuideDetail,
  DocumentIssuerRecord,
  DocumentIssuingGuide,
  DocumentRecord,
} from '@janasahayak/types';
import type { Queryable } from '../client.js';

export interface DocumentWithIssuer {
  document: DocumentRecord;
  issuer: DocumentIssuerRecord | null;
}

export function parseIssuingGuide(rawGuide: unknown, documentName: string): DocumentIssuingGuide {
  const guide = (
    rawGuide && typeof rawGuide === 'object' ? rawGuide : {}
  ) as Partial<DocumentIssuingGuide>;

  return {
    purpose: guide.purpose ?? {
      en: `Official government document required to verify eligibility and citizen claims for ${documentName}.`,
    },
    prerequisites: Array.isArray(guide.prerequisites) ? guide.prerequisites : [],
    issuingAuthority: guide.issuingAuthority ?? {
      name: 'Designated Public Issuing Authority',
      department: 'Competent Government Department',
      portalUrl: null,
      physicalOffices: 'District Administrative Office / Citizen Service Counter',
      helpline: null,
    },
    processingTimeDays:
      typeof guide.processingTimeDays === 'number' ? guide.processingTimeDays : 14,
    fees: guide.fees ?? {
      en: 'Nominal statutory citizen service charge or free as per state policy.',
    },
    validityPeriod: guide.validityPeriod ?? {
      en: 'As specified by official issuing order.',
    },
    steps: Array.isArray(guide.steps) ? guide.steps : [],
    alternativeDocuments: Array.isArray(guide.alternativeDocuments)
      ? guide.alternativeDocuments
      : undefined,
  };
}

export async function findDocumentById(
  client: Queryable,
  idOrName: string,
): Promise<DocumentGuideDetail | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrName);

  let whereClause = 'WHERE d.id = $1';
  const paramValue = idOrName;

  if (!isUuid) {
    whereClause =
      "WHERE d.id = $1 OR LOWER(d.name) = LOWER($1) OR LOWER(REPLACE(d.name, ' ', '-')) = LOWER($1)";
  }

  const result = await client.query(
    `SELECT
       d.id, d.name, d.description, d.document_type, d.issuer_id, d.issuing_guide, d.created_at, d.updated_at,
       di.id AS issuer_pk, di.name AS issuer_name, di.issuer_type AS issuer_category, di.portal_url, di.created_at AS issuer_created_at
     FROM documents d
     LEFT JOIN document_issuers di ON di.id = d.issuer_id
     ${whereClause}
     LIMIT 1`,
    [paramValue],
  );

  const row = result.rows[0] as Record<string, unknown> | undefined;
  if (!row) return null;

  const docName = String(row.name);
  const guide = parseIssuingGuide(row.issuing_guide, docName);

  const issuer: DocumentIssuerRecord | null = row.issuer_pk
    ? {
        id: String(row.issuer_pk),
        name: String(row.issuer_name),
        issuerType: String(row.issuer_category),
        portalUrl: row.portal_url ? String(row.portal_url) : null,
        createdAt: (row.issuer_created_at as Date).toISOString(),
      }
    : null;

  const documentRecord: DocumentRecord = {
    id: String(row.id),
    name: docName,
    description: String(row.description),
    documentType: String(row.document_type),
    issuerId: row.issuer_id ? String(row.issuer_id) : null,
    issuingGuide: guide,
    createdAt: (row.created_at as Date).toISOString(),
    updatedAt: (row.updated_at as Date).toISOString(),
  };

  return {
    ...documentRecord,
    document: documentRecord,
    issuer,
    guide,
  };
}

export interface ServiceDocumentEntry extends DocumentRecord {
  isRequired: boolean;
  conditions: Record<string, unknown> | null;
  displayOrder: number;
}

export async function getDocumentsForService(
  client: Queryable,
  serviceIdOrSlug: string,
): Promise<ServiceDocumentEntry[]> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    serviceIdOrSlug,
  );
  let serviceId = serviceIdOrSlug;

  if (!isUuid) {
    const sResult = await client.query('SELECT id FROM service_records WHERE slug = $1', [
      serviceIdOrSlug,
    ]);
    if (sResult.rows.length > 0) {
      serviceId = String((sResult.rows[0] as Record<string, unknown>).id);
    }
  }

  const result = await client.query(
    `SELECT
       d.id, d.name, d.description, d.document_type, d.issuer_id, d.issuing_guide, d.created_at, d.updated_at,
       sd.is_required, sd.conditions, sd.display_order
     FROM service_documents sd
     JOIN documents d ON d.id = sd.document_id
     WHERE sd.service_id = $1
     ORDER BY sd.display_order ASC`,
    [serviceId],
  );

  return (result.rows as Record<string, unknown>[]).map((row) => {
    const name = String(row.name);
    return {
      id: String(row.id),
      name,
      description: String(row.description),
      documentType: String(row.document_type),
      issuerId: row.issuer_id ? String(row.issuer_id) : null,
      issuingGuide: parseIssuingGuide(row.issuing_guide, name),
      isRequired: Boolean(row.is_required),
      conditions: (row.conditions as Record<string, unknown>) ?? null,
      displayOrder: Number(row.display_order),
      createdAt: (row.created_at as Date).toISOString(),
      updatedAt: (row.updated_at as Date).toISOString(),
    };
  });
}
