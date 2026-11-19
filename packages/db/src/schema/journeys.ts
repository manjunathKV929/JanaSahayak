import type { JourneyRecord, JourneyStepRecord } from '@janasahayak/types';
import type { Queryable } from '../client.js';

export interface JourneyWithSteps {
  journey: JourneyRecord;
  steps: JourneyStepRecord[];
}

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
