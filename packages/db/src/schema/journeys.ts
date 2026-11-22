import type {
  JourneyRecord,
  JourneyStepRecord,
  UserJourneyProgressRecord,
  UserJourneyRecord,
} from '@janasahayak/types';
import type { Queryable } from '../client.js';

export const DEFAULT_ANONYMOUS_USER_ID = 'b0000000-0000-0000-0000-000000000099';

export interface JourneyWithSteps {
  journey: JourneyRecord;
  steps: JourneyStepRecord[];
}

export interface UserJourneyBundle {
  userJourney: UserJourneyRecord;
  journey: JourneyRecord;
  steps: JourneyStepRecord[];
  progressRecords: UserJourneyProgressRecord[];
  service: {
    id: string;
    slug: string;
    title: string;
  };
}

/**
 * Retrieves the journey template and steps for a service ID.
 */
export async function getJourneyWithSteps(
  client: Queryable,
  serviceId: string,
): Promise<JourneyWithSteps | null> {
  const jResult = await client.query(
    `SELECT id, service_id, title, description, version, created_at, updated_at
     FROM journeys
     WHERE service_id = $1
     ORDER BY version DESC
     LIMIT 1`,
    [serviceId],
  );

  const rawJ = jResult.rows[0] as Record<string, unknown> | undefined;
  if (!rawJ) return null;

  const journeyId = String(rawJ.id);
  const journey: JourneyRecord = {
    id: journeyId,
    serviceId: String(rawJ.service_id),
    title: String(rawJ.title),
    description: String(rawJ.description),
    version: Number(rawJ.version),
    createdAt: (rawJ.created_at as Date).toISOString(),
    updatedAt: (rawJ.updated_at as Date).toISOString(),
  };

  const sResult = await client.query(
    `SELECT id, journey_id, step_key, title, description, step_type, display_order, official_url, completion_rule
     FROM journey_steps
     WHERE journey_id = $1
     ORDER BY display_order ASC`,
    [journeyId],
  );

  const steps: JourneyStepRecord[] = (sResult.rows as Record<string, unknown>[]).map((s) => ({
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

  return { journey, steps };
}

/**
 * Resolves a service by UUID or slug and retrieves its journey template.
 */
export async function getJourneyByService(
  client: Queryable,
  serviceIdOrSlug: string,
): Promise<{
  service: { id: string; slug: string; title: string };
  journey: JourneyRecord;
  steps: JourneyStepRecord[];
} | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    serviceIdOrSlug,
  );
  const serviceRes = await client.query(
    isUuid
      ? `SELECT id, slug, title FROM service_records WHERE id = $1`
      : `SELECT id, slug, title FROM service_records WHERE slug = $1`,
    [serviceIdOrSlug],
  );

  const service = serviceRes.rows[0] as { id: string; slug: string; title: string } | undefined;
  if (!service) return null;

  const bundle = await getJourneyWithSteps(client, service.id);
  if (!bundle) return null;

  return {
    service,
    journey: bundle.journey,
    steps: bundle.steps,
  };
}

/**
 * Creates or resumes an active user journey for a service and user.
 */
export async function createOrResumeUserJourney(
  client: Queryable,
  serviceIdOrSlug: string,
  userId: string = DEFAULT_ANONYMOUS_USER_ID,
): Promise<UserJourneyBundle | null> {
  const templateBundle = await getJourneyByService(client, serviceIdOrSlug);
  if (!templateBundle) return null;

  const { service, journey, steps } = templateBundle;

  // Check if active user journey already exists
  const existingUJ = await client.query(
    `SELECT id, user_id, journey_id, service_id, status, started_at, completed_at, created_at, updated_at
     FROM user_journeys
     WHERE user_id = $1 AND service_id = $2
     ORDER BY created_at DESC
     LIMIT 1`,
    [userId, service.id],
  );

  let rawUserJourney = existingUJ.rows[0] as Record<string, unknown> | undefined;

  if (!rawUserJourney) {
    const insertUJ = await client.query(
      `INSERT INTO user_journeys (user_id, journey_id, service_id, status)
       VALUES ($1, $2, $3, 'IN_PROGRESS')
       RETURNING id, user_id, journey_id, service_id, status, started_at, completed_at, created_at, updated_at`,
      [userId, journey.id, service.id],
    );
    rawUserJourney = insertUJ.rows[0] as Record<string, unknown>;
  }

  const userJourney: UserJourneyRecord = {
    id: String(rawUserJourney.id),
    userId: String(rawUserJourney.user_id),
    journeyId: String(rawUserJourney.journey_id),
    serviceId: String(rawUserJourney.service_id),
    status: rawUserJourney.status as 'IN_PROGRESS' | 'COMPLETED',
    startedAt: (rawUserJourney.started_at as Date).toISOString(),
    completedAt: rawUserJourney.completed_at
      ? (rawUserJourney.completed_at as Date).toISOString()
      : null,
    createdAt: (rawUserJourney.created_at as Date).toISOString(),
    updatedAt: (rawUserJourney.updated_at as Date).toISOString(),
  };

  // Ensure step progress records exist for all steps
  for (const step of steps) {
    await client.query(
      `INSERT INTO user_journey_progress (user_id, journey_id, step_id, status)
       VALUES ($1, $2, $3, 'PENDING')
       ON CONFLICT (user_id, step_id) DO NOTHING`,
      [userId, journey.id, step.id],
    );
  }

  // Retrieve current step progress records
  const progressRes = await client.query(
    `SELECT id, user_id, journey_id, step_id, status, completed_at, created_at, updated_at
     FROM user_journey_progress
     WHERE user_id = $1 AND journey_id = $2`,
    [userId, journey.id],
  );

  const progressRecords: UserJourneyProgressRecord[] = (
    progressRes.rows as Record<string, unknown>[]
  ).map((p) => ({
    id: String(p.id),
    userId: String(p.user_id),
    journeyId: String(p.journey_id),
    stepId: String(p.step_id),
    status: p.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED',
    completedAt: p.completed_at ? (p.completed_at as Date).toISOString() : null,
    createdAt: (p.created_at as Date).toISOString(),
    updatedAt: (p.updated_at as Date).toISOString(),
  }));

  return {
    userJourney,
    journey,
    steps,
    progressRecords,
    service,
  };
}

/**
 * Retrieves a user journey bundle by userJourneyId, template journeyId, or service slug.
 */
export async function getUserJourneyInstance(
  client: Queryable,
  idOrSlug: string,
  userId: string = DEFAULT_ANONYMOUS_USER_ID,
): Promise<UserJourneyBundle | null> {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);

  if (isUuid) {
    // 1. Check if id is a user_journeys record
    const ujRes = await client.query(
      `SELECT uj.id, uj.user_id, uj.journey_id, uj.service_id, uj.status, uj.started_at, uj.completed_at, uj.created_at, uj.updated_at,
              s.slug AS service_slug, s.title AS service_title,
              j.title AS journey_title, j.description AS journey_description, j.version AS journey_version
       FROM user_journeys uj
       JOIN service_records s ON s.id = uj.service_id
       JOIN journeys j ON j.id = uj.journey_id
       WHERE uj.id = $1`,
      [idOrSlug],
    );

    if (ujRes.rows.length > 0) {
      const raw = ujRes.rows[0] as Record<string, unknown>;
      const userJourney: UserJourneyRecord = {
        id: String(raw.id),
        userId: String(raw.user_id),
        journeyId: String(raw.journey_id),
        serviceId: String(raw.service_id),
        status: raw.status as 'IN_PROGRESS' | 'COMPLETED',
        startedAt: (raw.started_at as Date).toISOString(),
        completedAt: raw.completed_at ? (raw.completed_at as Date).toISOString() : null,
        createdAt: (raw.created_at as Date).toISOString(),
        updatedAt: (raw.updated_at as Date).toISOString(),
      };

      const journey: JourneyRecord = {
        id: userJourney.journeyId,
        serviceId: userJourney.serviceId,
        title: String(raw.journey_title),
        description: String(raw.journey_description),
        version: Number(raw.journey_version),
        createdAt: userJourney.createdAt,
        updatedAt: userJourney.updatedAt,
      };

      const service = {
        id: userJourney.serviceId,
        slug: String(raw.service_slug),
        title: String(raw.service_title),
      };

      const sResult = await client.query(
        `SELECT id, journey_id, step_key, title, description, step_type, display_order, official_url, completion_rule
         FROM journey_steps
         WHERE journey_id = $1
         ORDER BY display_order ASC`,
        [journey.id],
      );

      const steps: JourneyStepRecord[] = (sResult.rows as Record<string, unknown>[]).map((s) => ({
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

      const progressRes = await client.query(
        `SELECT id, user_id, journey_id, step_id, status, completed_at, created_at, updated_at
         FROM user_journey_progress
         WHERE user_id = $1 AND journey_id = $2`,
        [userJourney.userId, journey.id],
      );

      const progressRecords: UserJourneyProgressRecord[] = (
        progressRes.rows as Record<string, unknown>[]
      ).map((p) => ({
        id: String(p.id),
        userId: String(p.user_id),
        journeyId: String(p.journey_id),
        stepId: String(p.step_id),
        status: p.status as 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'BLOCKED',
        completedAt: p.completed_at ? (p.completed_at as Date).toISOString() : null,
        createdAt: (p.created_at as Date).toISOString(),
        updatedAt: (p.updated_at as Date).toISOString(),
      }));

      return { userJourney, journey, steps, progressRecords, service };
    }
  }

  // 2. Fall back to finding/resuming by service slug or service UUID
  return createOrResumeUserJourney(client, idOrSlug, userId);
}

/**
 * Marks a specific journey step complete for a user and updates overall progress.
 */
export async function completeUserJourneyStep(
  client: Queryable,
  journeyOrInstanceId: string,
  stepIdOrKey: string,
  userId: string = DEFAULT_ANONYMOUS_USER_ID,
): Promise<UserJourneyBundle | null> {
  const bundle = await getUserJourneyInstance(client, journeyOrInstanceId, userId);
  if (!bundle) return null;

  const targetStep = bundle.steps.find((s) => s.id === stepIdOrKey || s.stepKey === stepIdOrKey);
  if (!targetStep) return null;

  const now = new Date();

  // Mark step completed
  await client.query(
    `INSERT INTO user_journey_progress (user_id, journey_id, step_id, status, completed_at, updated_at)
     VALUES ($1, $2, $3, 'COMPLETED', $4, $4)
     ON CONFLICT (user_id, step_id)
     DO UPDATE SET status = 'COMPLETED', completed_at = $4, updated_at = $4`,
    [bundle.userJourney.userId, bundle.journey.id, targetStep.id, now],
  );

  // Check if all steps in journey are completed
  const allProgressRes = await client.query(
    `SELECT step_id, status
     FROM user_journey_progress
     WHERE user_id = $1 AND journey_id = $2`,
    [bundle.userJourney.userId, bundle.journey.id],
  );

  const completedStepIds = new Set(
    (allProgressRes.rows as Record<string, unknown>[])
      .filter((r) => r.status === 'COMPLETED')
      .map((r) => String(r.step_id)),
  );

  const allDone = bundle.steps.every((s) => completedStepIds.has(s.id));
  if (allDone) {
    await client.query(
      `UPDATE user_journeys
       SET status = 'COMPLETED', completed_at = $1, updated_at = $1
       WHERE id = $2`,
      [now, bundle.userJourney.id],
    );
  }

  return getUserJourneyInstance(client, bundle.userJourney.id, bundle.userJourney.userId);
}
