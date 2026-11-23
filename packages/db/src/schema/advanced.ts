import type {
  AssistanceType,
  CenterType,
  DeadlineStatus,
  DeadlineSummary,
  LocationSummary,
} from '@janasahayak/types';
import type { DeadlineQueryParams, LocationQueryParams } from '@janasahayak/validation';
import type { Queryable } from '../client.js';

interface RawDeadlineRow {
  id: string;
  service_id: string;
  service_slug: string;
  service_title: string;
  category: string;
  state_code: string | null;
  name: string;
  opens_at: string | null;
  closes_at: string | null;
  status: string;
  source_url: string | null;
  publisher: string | null;
  last_verified_at: string | null;
}

export function computeDeadlineStatus(
  opensAt: string | null,
  closesAt: string | null,
  now: Date = new Date(),
): { status: DeadlineStatus; daysRemaining: number | null } {
  if (opensAt && new Date(opensAt).getTime() > now.getTime()) {
    return { status: 'UPCOMING', daysRemaining: null };
  }

  if (!closesAt) {
    return { status: 'OPEN', daysRemaining: null };
  }

  const closeTime = new Date(closesAt).getTime();
  const diffMs = closeTime - now.getTime();
  const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { status: 'EXPIRED', daysRemaining: 0 };
  }
  if (daysRemaining <= 15) {
    return { status: 'CLOSING_SOON', daysRemaining };
  }
  return { status: 'OPEN', daysRemaining };
}

export async function listDeadlines(
  db: Queryable,
  filters: DeadlineQueryParams,
): Promise<DeadlineSummary[]> {
  const conditions: string[] = ['sr.status = $1'];
  const values: unknown[] = ['PUBLISHED'];
  let paramIndex = 2;

  if (filters.state) {
    conditions.push(`sr.state_code = $${paramIndex++}`);
    values.push(filters.state);
  }

  if (filters.category) {
    conditions.push(`sr.service_type = $${paramIndex++}`);
    values.push(filters.category);
  }

  if (filters.from) {
    conditions.push(`d.closes_at >= $${paramIndex++}`);
    values.push(filters.from);
  }

  if (filters.to) {
    conditions.push(`d.closes_at <= $${paramIndex++}`);
    values.push(filters.to);
  }

  const sql = `
    SELECT
      d.id,
      d.service_id,
      sr.slug AS service_slug,
      sr.title AS service_title,
      sr.service_type AS category,
      sr.state_code,
      d.name,
      d.opens_at,
      d.closes_at,
      d.status,
      ss.source_url,
      ss.publisher,
      ss.last_verified_at
    FROM deadlines d
    JOIN service_records sr ON sr.id = d.service_id
    LEFT JOIN service_sources ss ON ss.id = d.source_id
    WHERE ${conditions.join(' AND ')}
    ORDER BY d.closes_at ASC NULLS LAST, d.opens_at ASC NULLS LAST
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;

  values.push(filters.limit, filters.offset);
  const result = await db.query(sql, values);

  const now = new Date();
  const items: DeadlineSummary[] = [];

  for (const row of result.rows as unknown as RawDeadlineRow[]) {
    const { status: calculatedStatus, daysRemaining } = computeDeadlineStatus(
      row.opens_at,
      row.closes_at,
      now,
    );

    if (filters.status !== 'ALL' && calculatedStatus !== filters.status) {
      continue;
    }

    items.push({
      id: row.id,
      serviceId: row.service_id,
      serviceSlug: row.service_slug,
      serviceTitle: row.service_title,
      category: row.category,
      stateCode: row.state_code,
      name: row.name,
      opensAt: row.opens_at,
      closesAt: row.closes_at,
      daysRemaining,
      status: calculatedStatus,
      sourceUrl: row.source_url,
      sourcePublisher: row.publisher,
      lastVerifiedAt: row.last_verified_at,
    });
  }

  return items;
}

export async function getDeadlinesForService(
  db: Queryable,
  serviceIdOrSlug: string,
): Promise<DeadlineSummary[]> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    serviceIdOrSlug,
  );
  const condition = isUuid ? 'sr.id = $1' : 'sr.slug = $1';

  const sql = `
    SELECT
      d.id,
      d.service_id,
      sr.slug AS service_slug,
      sr.title AS service_title,
      sr.service_type AS category,
      sr.state_code,
      d.name,
      d.opens_at,
      d.closes_at,
      d.status,
      ss.source_url,
      ss.publisher,
      ss.last_verified_at
    FROM deadlines d
    JOIN service_records sr ON sr.id = d.service_id
    LEFT JOIN service_sources ss ON ss.id = d.source_id
    WHERE ${condition}
    ORDER BY d.closes_at ASC NULLS LAST;
  `;

  const result = await db.query(sql, [serviceIdOrSlug]);
  const now = new Date();

  return (result.rows as unknown as RawDeadlineRow[]).map((row) => {
    const { status: calculatedStatus, daysRemaining } = computeDeadlineStatus(
      row.opens_at,
      row.closes_at,
      now,
    );

    return {
      id: row.id,
      serviceId: row.service_id,
      serviceSlug: row.service_slug,
      serviceTitle: row.service_title,
      category: row.category,
      stateCode: row.state_code,
      name: row.name,
      opensAt: row.opens_at,
      closesAt: row.closes_at,
      daysRemaining,
      status: calculatedStatus,
      sourceUrl: row.source_url,
      sourcePublisher: row.publisher,
      lastVerifiedAt: row.last_verified_at,
    };
  });
}

interface RawLocationRow {
  id: string;
  name: string;
  center_type: string;
  address: string;
  district: string;
  taluk: string | null;
  state_code: string;
  pincode: string | null;
  latitude: string | number | null;
  longitude: string | number | null;
  contact_phone: string | null;
  operating_hours: string | null;
  verified_source_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  services_json: Array<{
    service_id: string;
    slug: string;
    title: string;
    assistance_type: string;
  }> | null;
}

export async function listLocations(
  db: Queryable,
  filters: LocationQueryParams,
): Promise<LocationSummary[]> {
  const conditions: string[] = ['l.is_active = true'];
  const values: unknown[] = [];
  let paramIndex = 1;

  if (filters.state) {
    conditions.push(`l.state_code = $${paramIndex++}`);
    values.push(filters.state);
  }

  if (filters.district) {
    conditions.push(`LOWER(l.district) = LOWER($${paramIndex++})`);
    values.push(filters.district);
  }

  if (filters.taluk) {
    conditions.push(`LOWER(l.taluk) = LOWER($${paramIndex++})`);
    values.push(filters.taluk);
  }

  if (filters.centerType) {
    conditions.push(`l.center_type = $${paramIndex++}`);
    values.push(filters.centerType);
  }

  if (filters.pincode) {
    conditions.push(`l.pincode = $${paramIndex++}`);
    values.push(filters.pincode);
  }

  if (filters.serviceId) {
    conditions.push(
      `EXISTS (SELECT 1 FROM service_locations sl WHERE sl.location_id = l.id AND sl.service_id = $${paramIndex++})`,
    );
    values.push(filters.serviceId);
  }

  const sql = `
    SELECT
      l.id,
      l.name,
      l.center_type,
      l.address,
      l.district,
      l.taluk,
      l.state_code,
      l.pincode,
      l.latitude,
      l.longitude,
      l.contact_phone,
      l.operating_hours,
      l.verified_source_url,
      l.is_active,
      l.created_at,
      l.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'service_id', sr.id,
            'slug', sr.slug,
            'title', sr.title,
            'assistance_type', sl.assistance_type
          )
        ) FILTER (WHERE sr.id IS NOT NULL),
        '[]'
      ) AS services_json
    FROM locations l
    LEFT JOIN service_locations sl ON sl.location_id = l.id
    LEFT JOIN service_records sr ON sr.id = sl.service_id AND sr.status = 'PUBLISHED'
    WHERE ${conditions.join(' AND ')}
    GROUP BY l.id
    ORDER BY l.district ASC, l.name ASC
    LIMIT $${paramIndex++} OFFSET $${paramIndex++};
  `;

  values.push(filters.limit, filters.offset);
  const result = await db.query(sql, values);

  return (result.rows as unknown as RawLocationRow[]).map(mapLocationRow);
}

export async function getLocationsForService(
  db: Queryable,
  serviceIdOrSlug: string,
): Promise<LocationSummary[]> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    serviceIdOrSlug,
  );
  const condition = isUuid ? 'target_sr.id = $1' : 'target_sr.slug = $1';

  const sql = `
    SELECT
      l.id,
      l.name,
      l.center_type,
      l.address,
      l.district,
      l.taluk,
      l.state_code,
      l.pincode,
      l.latitude,
      l.longitude,
      l.contact_phone,
      l.operating_hours,
      l.verified_source_url,
      l.is_active,
      l.created_at,
      l.updated_at,
      COALESCE(
        json_agg(
          json_build_object(
            'service_id', sr.id,
            'slug', sr.slug,
            'title', sr.title,
            'assistance_type', sl.assistance_type
          )
        ) FILTER (WHERE sr.id IS NOT NULL),
        '[]'
      ) AS services_json
    FROM locations l
    JOIN service_locations target_sl ON target_sl.location_id = l.id
    JOIN service_records target_sr ON target_sr.id = target_sl.service_id
    LEFT JOIN service_locations sl ON sl.location_id = l.id
    LEFT JOIN service_records sr ON sr.id = sl.service_id AND sr.status = 'PUBLISHED'
    WHERE ${condition} AND l.is_active = true
    GROUP BY l.id
    ORDER BY l.district ASC, l.name ASC;
  `;

  const result = await db.query(sql, [serviceIdOrSlug]);
  return (result.rows as unknown as RawLocationRow[]).map(mapLocationRow);
}

function mapLocationRow(row: RawLocationRow): LocationSummary {
  const supportedServices = (row.services_json ?? []).map((s) => ({
    serviceId: s.service_id,
    serviceSlug: s.slug,
    serviceTitle: s.title,
    assistanceType: s.assistance_type as AssistanceType,
  }));

  return {
    id: row.id,
    name: row.name,
    centerType: row.center_type as CenterType,
    address: row.address,
    district: row.district,
    taluk: row.taluk,
    stateCode: row.state_code,
    pincode: row.pincode,
    latitude: row.latitude !== null ? Number(row.latitude) : null,
    longitude: row.longitude !== null ? Number(row.longitude) : null,
    contactPhone: row.contact_phone,
    operatingHours: row.operating_hours,
    verifiedSourceUrl: row.verified_source_url,
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    supportedServices,
  };
}
