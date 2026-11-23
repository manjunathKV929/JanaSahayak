import { loadApiEnv } from '@janasahayak/config';
import { API_BASE_PATH, buildApp } from './app.js';

interface OpenApiDocument {
  openapi?: string;
  info?: { title?: string; version?: string };
  servers?: Array<{ url?: string }>;
  paths?: Record<string, Record<string, unknown>>;
}

async function validateOpenApi(): Promise<void> {
  const env = loadApiEnv({
    NODE_ENV: 'test',
    API_CORS_ORIGINS: 'http://localhost:3000',
  });
  const app = await buildApp({
    env,
    logger: false,
    checkDatabase: async () => 'not_configured',
  });

  try {
    await app.ready();
    const spec = app.swagger() as OpenApiDocument;

    if (!spec.openapi || !spec.openapi.startsWith('3.')) {
      throw new Error(`Expected OpenAPI 3.x version, got: ${String(spec.openapi)}`);
    }
    if (!spec.info?.title || !spec.info?.version) {
      throw new Error('OpenAPI info.title and info.version are required');
    }
    const baseServerUrl = spec.servers?.[0]?.url;
    if (baseServerUrl !== API_BASE_PATH) {
      throw new Error(
        `Expected OpenAPI server URL ${API_BASE_PATH}, got: ${String(baseServerUrl)}`,
      );
    }
    const requiredPaths = [
      '/health',
      '/ready',
      '/admin/services',
      '/admin/services/{id}',
      '/admin/services/{id}/versions',
      '/admin/services/{id}/sources',
      '/admin/services/{id}/submit-review',
      '/admin/services/{id}/review',
      '/admin/services/{id}/publish',
      '/admin/services/{id}/deprecate',
      '/admin/services/{id}/history',
      '/admin/audit-logs',
      '/services',
      '/services/{slug}',
      '/services/{id}/sources',
      '/categories',
      '/services/{id}/eligibility/questions',
      '/services/{id}/eligibility/evaluate',
      '/documents/{id}',
      '/services/{id}/documents',
      '/services/{id}/journeys',
      '/journeys/{id}',
      '/journeys/{id}/steps/{stepId}/complete',
      '/languages',
      '/translate',
      '/translate/batch',
      '/search/interpret',
      '/ai/assist',
      '/deadlines',
      '/services/{id}/deadlines',
      '/locations',
      '/services/{id}/locations',
      '/life-events',
      '/life-events/{key}',
      '/family/scan',
    ];

    for (const requiredPath of requiredPaths) {
      if (!spec.paths || !spec.paths[requiredPath]) {
        throw new Error(`OpenAPI paths must include ${requiredPath} under ${baseServerUrl}`);
      }
    }

    const pathCount = spec.paths ? Object.keys(spec.paths).length : 0;
    process.stdout.write(
      `OpenAPI ${spec.openapi} validation passed (${pathCount} documented paths under ${baseServerUrl}).\n`,
    );
  } finally {
    await app.close();
  }
}

validateOpenApi().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown OpenAPI validation error';
  process.stderr.write(`OpenAPI validation failed: ${message}\n`);
  process.exit(1);
});
