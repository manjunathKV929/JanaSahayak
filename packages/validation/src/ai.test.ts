import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { aiAssistBodySchema, searchInterpretationBodySchema } from './ai.js';

describe('AI Validation Schemas', () => {
  it('validates searchInterpretationBodySchema successfully', () => {
    const valid = searchInterpretationBodySchema.parse({
      query: 'Mujhe scholarship chahiye',
      language: 'hi',
    });
    assert.equal(valid.query, 'Mujhe scholarship chahiye');
    assert.equal(valid.language, 'hi');
  });

  it('rejects empty search query', () => {
    const res = searchInterpretationBodySchema.safeParse({ query: '   ' });
    assert.equal(res.success, false);
  });

  it('validates aiAssistBodySchema with context', () => {
    const valid = aiAssistBodySchema.parse({
      message: 'Income certificate validity kitni hoti hai?',
      language: 'hi',
      context: {
        serviceId: 'e0000000-0000-0000-0000-000000000001',
      },
    });
    assert.equal(valid.message, 'Income certificate validity kitni hoti hai?');
    assert.equal(valid.context?.serviceId, 'e0000000-0000-0000-0000-000000000001');
  });

  it('rejects invalid uuid in context', () => {
    const res = aiAssistBodySchema.safeParse({
      message: 'Test message',
      context: { serviceId: 'not-a-uuid' },
    });
    assert.equal(res.success, false);
  });
});
