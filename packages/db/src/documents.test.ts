import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import type { Queryable } from './client.js';
import { findDocumentById, getDocumentsForService } from './schema/documents.js';

describe('@janasahayak/db Document Guide Repository', () => {
  const fakeDate = new Date('2026-11-10T00:00:00Z');

  it('finds document by UUID and parses full issuing guide', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        assert.match(String(sql), /FROM documents d/);
        assert.equal(params?.[0], 'd1');
        return {
          rows: [
            {
              id: 'd1',
              name: 'Income Certificate (Form F / RD)',
              description: 'Official revenue certificate',
              document_type: 'CERTIFICATE',
              issuer_id: 'i1',
              issuing_guide: {
                purpose: { en: 'Proves income for scholarships' },
                processingTimeDays: 14,
                steps: [
                  { stepNumber: 1, title: 'Gather Aadhaar', description: { en: 'Keep ready' } },
                ],
              },
              created_at: fakeDate,
              updated_at: fakeDate,
              issuer_pk: 'i1',
              issuer_name: 'Nadakacheri',
              issuer_category: 'STATE_DEPARTMENT',
              portal_url: 'https://nadakacheri.karnataka.gov.in',
              issuer_created_at: fakeDate,
            },
          ],
        };
      },
    };

    const doc = await findDocumentById(mockClient, 'd1');
    assert.ok(doc);
    assert.equal(doc.id, 'd1');
    assert.equal(doc.name, 'Income Certificate (Form F / RD)');
    assert.equal(doc.issuer?.name, 'Nadakacheri');
    assert.equal(doc.guide.processingTimeDays, 14);
    assert.equal(doc.guide.steps.length, 1);
  });

  it('returns null when document does not exist', async () => {
    const mockClient: Queryable = {
      query: async () => ({ rows: [] }),
    };

    const doc = await findDocumentById(mockClient, 'unknown-doc-id');
    assert.equal(doc, null);
  });

  it('retrieves documents for service by slug or id', async () => {
    const mockClient: Queryable = {
      query: async (sql, params) => {
        const sqlStr = String(sql);
        if (sqlStr.includes('SELECT id FROM service_records WHERE slug = $1')) {
          assert.equal(params?.[0], 'synthetic-scholarship');
          return { rows: [{ id: 's1' }] };
        }
        assert.match(sqlStr, /FROM service_documents sd/);
        assert.equal(params?.[0], 's1');
        return {
          rows: [
            {
              id: 'doc1',
              name: 'Income Certificate',
              description: 'Income proof',
              document_type: 'CERTIFICATE',
              issuer_id: 'i1',
              issuing_guide: null,
              is_required: true,
              conditions: null,
              display_order: 1,
              created_at: fakeDate,
              updated_at: fakeDate,
            },
          ],
        };
      },
    };

    const docs = await getDocumentsForService(mockClient, 'synthetic-scholarship');
    assert.equal(docs.length, 1);
    assert.equal(docs[0]?.id, 'doc1');
    assert.equal(docs[0]?.isRequired, true);
    assert.equal(docs[0]?.issuingGuide?.processingTimeDays, 14); // Fallback default
  });
});
