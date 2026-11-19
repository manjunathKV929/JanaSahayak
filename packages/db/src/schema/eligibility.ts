import type {
  DeterministicRuleExpression,
  EligibilityOptionRecord,
  EligibilityQuestionRecord,
  EligibilityRuleRecord,
} from '@janasahayak/types';
import type { Queryable } from '../client.js';

export interface EligibilityQuestionWithOptions extends EligibilityQuestionRecord {
  options: EligibilityOptionRecord[];
}

export interface ServiceEligibilityBundle {
  questions: EligibilityQuestionWithOptions[];
  rules: EligibilityRuleRecord[];
}

export async function getEligibilityForService(
  client: Queryable,
  serviceIdOrSlug: string,
): Promise<ServiceEligibilityBundle> {
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

  const qResult = await client.query(
    `SELECT id, service_id, key, question_text, answer_type, required, display_order
     FROM eligibility_questions
     WHERE service_id = $1
     ORDER BY display_order ASC`,
    [serviceId],
  );

  const rawQuestions = qResult.rows as Record<string, unknown>[];
  const questions: EligibilityQuestionWithOptions[] = [];

  for (const q of rawQuestions) {
    const qId = String(q.id);
    const optResult = await client.query(
      `SELECT id, question_id, key, label, display_order
       FROM eligibility_options
       WHERE question_id = $1
       ORDER BY display_order ASC`,
      [qId],
    );

    const options: EligibilityOptionRecord[] = (optResult.rows as Record<string, unknown>[]).map(
      (opt) => ({
        id: String(opt.id),
        questionId: String(opt.question_id),
        key: String(opt.key),
        label: (opt.label as Record<string, string>) ?? {},
        displayOrder: Number(opt.display_order),
      }),
    );

    questions.push({
      id: qId,
      serviceId: String(q.service_id),
      key: String(q.key),
      questionText: (q.question_text as Record<string, string>) ?? {},
      answerType: q.answer_type as EligibilityQuestionRecord['answerType'],
      required: Boolean(q.required),
      displayOrder: Number(q.display_order),
      options,
    });
  }

  const rResult = await client.query(
    `SELECT id, service_id, name, rule_expression, explanation, priority, created_at, updated_at
     FROM eligibility_rules
     WHERE service_id = $1
     ORDER BY priority ASC`,
    [serviceId],
  );

  const rules: EligibilityRuleRecord[] = (rResult.rows as Record<string, unknown>[]).map((r) => ({
    id: String(r.id),
    serviceId: String(r.service_id),
    name: String(r.name),
    ruleExpression: r.rule_expression as DeterministicRuleExpression,
    explanation: (r.explanation as Record<string, string>) ?? {},
    priority: Number(r.priority),
    createdAt: (r.created_at as Date).toISOString(),
    updatedAt: (r.updated_at as Date).toISOString(),
  }));

  return { questions, rules };
}
