import type { ContentReviewRecord } from '@janasahayak/types';
import type { Queryable } from '../client.js';

export interface NewContentReviewEntry {
  serviceId: string;
  reviewerId?: string | null | undefined;
  decision: 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED';
  notes?: string | null | undefined;
}

export async function recordContentReview(
  client: Queryable,
  entry: NewContentReviewEntry,
): Promise<ContentReviewRecord> {
  const result = await client.query(
    `INSERT INTO content_reviews (service_id, reviewer_id, decision, notes)
     VALUES ($1, $2, $3, $4)
     RETURNING id, service_id, reviewer_id, decision, notes, reviewed_at`,
    [entry.serviceId, entry.reviewerId ?? null, entry.decision, entry.notes ?? null],
  );

  const row = result.rows[0] as Record<string, unknown>;
  return {
    id: String(row.id),
    serviceId: String(row.service_id),
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : null,
    decision: row.decision as ContentReviewRecord['decision'],
    notes: row.notes ? String(row.notes) : null,
    reviewedAt: (row.reviewed_at as Date).toISOString(),
  };
}

export async function getReviewsForService(
  client: Queryable,
  serviceId: string,
): Promise<ContentReviewRecord[]> {
  const result = await client.query(
    `SELECT id, service_id, reviewer_id, decision, notes, reviewed_at
     FROM content_reviews
     WHERE service_id = $1
     ORDER BY reviewed_at DESC`,
    [serviceId],
  );

  return (result.rows as Record<string, unknown>[]).map((row) => ({
    id: String(row.id),
    serviceId: String(row.service_id),
    reviewerId: row.reviewer_id ? String(row.reviewer_id) : null,
    decision: row.decision as ContentReviewRecord['decision'],
    notes: row.notes ? String(row.notes) : null,
    reviewedAt: (row.reviewed_at as Date).toISOString(),
  }));
}
