import assert from 'node:assert/strict';
import { after, before, describe, it } from 'node:test';
import type { FastifyInstance } from 'fastify';
import { loadApiEnv } from '@janasahayak/config';
import type { Queryable } from '@janasahayak/db';
import { buildApp } from './app.js';

describe('Multilingual & Translation API Routes', () => {
  let app: FastifyInstance;

  const mockDb: Queryable = {
    query: async (sql, params) => {
      const sqlStr = String(sql);
      if (sqlStr.includes('FROM service_records')) {
        return {
          rows: [
            {
              id: 'e0000000-0000-0000-0000-000000000001',
              slug: 'synthetic-post-matric-scholarship',
              service_type: 'SCHOLARSHIP',
              title: '[Synthetic Sample] Post-Matric Scholarship',
              short_description: 'Description',
              department_name: 'Social Welfare',
              state_code: 'KA',
              status: 'PUBLISHED',
              current_version_id: 'f0000000-0000-0000-0000-000000000001',
              created_at: new Date('2026-11-10T00:00:00Z'),
              updated_at: new Date('2026-11-17T00:00:00Z'),
            },
          ],
        };
      }
      if (sqlStr.includes('WHERE service_id = $1 AND language = $2')) {
        if (params?.[1] === 'kn') {
          return {
            rows: [
              {
                id: 'f0000000-0000-0000-0000-000000000002',
                service_id: 'e0000000-0000-0000-0000-000000000001',
                version_number: 2,
                content: {
                  title: '[ಮಾದರಿ] ಮೆಟ್ರಿಕ್-ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ (ಕರ್ನಾಟಕ)',
                  overview: 'ಕರ್ನಾಟಕದಲ್ಲಿ ವಿದ್ಯಾರ್ಥಿಗಳಿಗೆ ಆರ್ಥಿಕ ನೆರವು.',
                },
                language: 'kn',
                effective_from: '2026-01-01',
                effective_to: null,
                created_by: 'b0000000-0000-0000-0000-000000000001',
                approved_by: 'b0000000-0000-0000-0000-000000000001',
                created_at: new Date('2026-11-15T00:00:00Z'),
              },
            ],
          };
        }
      }
      if (sqlStr.includes('FROM service_versions WHERE id = $1')) {
        return {
          rows: [
            {
              id: 'f0000000-0000-0000-0000-000000000001',
              service_id: 'e0000000-0000-0000-0000-000000000001',
              version_number: 1,
              content: { overview: 'English version' },
              language: 'en',
              effective_from: '2026-01-01',
              effective_to: null,
              created_by: 'b0000000-0000-0000-0000-000000000001',
              approved_by: 'b0000000-0000-0000-0000-000000000001',
              created_at: new Date('2026-11-15T00:00:00Z'),
            },
          ],
        };
      }
      return { rows: [] };
    },
  };

  before(async () => {
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });
    app = await buildApp({
      env,
      logger: false,
      db: mockDb,
      checkDatabase: async () => 'up',
    });
    await app.ready();
  });

  after(async () => {
    await app.close();
  });

  it('GET /api/v1/languages returns supported languages metadata', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/languages',
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.ok(Array.isArray(json.data));
    assert.equal(json.data.length, 3);

    const codes = json.data.map((l: { code: string }) => l.code);
    assert.deepEqual(codes, ['en', 'hi', 'kn']);

    const kannada = json.data.find((l: { code: string }) => l.code === 'kn');
    assert.equal(kannada.nativeName, 'ಕನ್ನಡ');
    assert.equal(kannada.script, 'Kannada');
  });

  it('POST /api/v1/translate translates civic terminology with numeric preservation', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/translate',
      payload: {
        text: 'Income Certificate',
        sourceLanguage: 'en',
        targetLanguage: 'kn',
      },
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.data.translatedText, 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ');
    assert.equal(json.data.targetLanguage, 'kn');
    assert.equal(json.data.preservedNumbers, true);
  });

  it('POST /api/v1/translate preserves numeric rules like ₹2,50,000 threshold', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/translate',
      payload: {
        text: 'Annual family income must be below ₹2,50,000',
        sourceLanguage: 'en',
        targetLanguage: 'hi',
      },
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.data.translatedText, 'वार्षिक पारिवारिक आय ₹2,50,000 से कम होनी चाहिए');
    assert.equal(json.data.preservedNumbers, true);
  });

  it('POST /api/v1/translate rejects invalid request with 400', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/translate',
      payload: {
        text: '',
        targetLanguage: 'kn',
      },
    });

    assert.equal(res.statusCode, 400);
    const json = JSON.parse(res.body);
    assert.equal(json.error.code, 'VALIDATION_ERROR');
  });

  it('POST /api/v1/translate/batch translates multiple texts concurrently', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/translate/batch',
      payload: {
        texts: ['Income Certificate', 'Senior Citizen Card'],
        targetLanguage: 'kn',
      },
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.data.length, 2);
    assert.equal(json.data[0].translatedText, 'ಆದಾಯ ಪ್ರಮಾಣಪತ್ರ');
    assert.equal(json.data[1].translatedText, 'ಹಿರಿಯ ನಾಗರಿಕರ ಗುರುತಿನ ಚೀಟಿ');
  });

  it('GET /api/v1/services/:slug?language=kn returns localized version', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/services/synthetic-post-matric-scholarship?language=kn',
    });

    assert.equal(res.statusCode, 200);
    const json = JSON.parse(res.body);
    assert.equal(json.data.version.language, 'kn');
    assert.equal(json.data.version.content.title, '[ಮಾದರಿ] ಮೆಟ್ರಿಕ್-ನಂತರದ ವಿದ್ಯಾರ್ಥಿವೇತನ ಯೋಜನೆ (ಕರ್ನಾಟಕ)');
  });
});
