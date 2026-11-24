import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { loadApiEnv } from '@janasahayak/config';
import { buildApp } from './app.js';
import { MetricsRegistry } from './metrics.js';

describe('Production Observability & Metrics', () => {
  it('MetricsRegistry records and formats Prometheus metrics', () => {
    const registry = new MetricsRegistry();

    registry.recordHttpRequest('GET', '/api/v1/services', 200, 0.012);
    registry.recordHttpRequest('GET', '/api/v1/services', 200, 0.045);
    registry.recordHttpRequest('POST', '/api/v1/eligibility/evaluate', 400, 0.003);

    registry.recordAiQuery('search');
    registry.recordAiQuery('assist');
    registry.recordEligibilityEvaluation('eligible');
    registry.recordEligibilityEvaluation('ineligible');

    registry.setDbPoolStats({
      total: 10,
      idle: 8,
      active: 2,
      waiting: 0,
    });

    const output = registry.renderPrometheusText();

    assert.ok(output.includes('# TYPE janasahayak_http_requests_total counter'));
    assert.ok(
      output.includes(
        'janasahayak_http_requests_total{method="GET",route="/api/v1/services",status_code="200"} 2',
      ),
    );
    assert.ok(
      output.includes(
        'janasahayak_http_requests_total{method="POST",route="/api/v1/eligibility/evaluate",status_code="400"} 1',
      ),
    );
    assert.ok(output.includes('# TYPE janasahayak_http_request_duration_seconds histogram'));
    assert.ok(output.includes('janasahayak_db_pool_connections{state="active"} 2'));
    assert.ok(output.includes('janasahayak_db_pool_connections{state="idle"} 8'));
    assert.ok(output.includes('janasahayak_ai_queries_total{type="search"} 1'));
    assert.ok(output.includes('janasahayak_eligibility_evaluations_total{verdict="eligible"} 1'));
    assert.ok(output.includes('janasahayak_process_uptime_seconds'));
    assert.ok(output.includes('janasahayak_process_resident_memory_bytes'));
  });

  it('GET /api/v1/metrics exposes Prometheus metrics over HTTP and tracks traffic', async () => {
    const customRegistry = new MetricsRegistry();
    const env = loadApiEnv({
      NODE_ENV: 'test',
      API_CORS_ORIGINS: 'http://localhost:3000',
    });

    const app = await buildApp({
      env,
      logger: false,
      metricsRegistry: customRegistry,
      checkDatabase: async () => 'up',
    });

    try {
      // Send health probe requests
      const res1 = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });
      assert.equal(res1.statusCode, 200);

      const res2 = await app.inject({
        method: 'GET',
        url: '/api/v1/health',
      });
      assert.equal(res2.statusCode, 200);

      // Scrape metrics
      const metricsRes = await app.inject({
        method: 'GET',
        url: '/api/v1/metrics',
      });

      assert.equal(metricsRes.statusCode, 200);
      assert.ok(
        metricsRes.headers['content-type']?.includes('text/plain'),
        'Content-Type must be text/plain',
      );
      assert.equal(
        metricsRes.headers['cache-control'],
        'no-store, no-cache, must-revalidate, private',
      );

      const body = metricsRes.payload;
      assert.ok(body.includes('janasahayak_http_requests_total'));
      assert.ok(body.includes('route="/api/v1/health"'), 'Must record requests to /api/v1/health');
      assert.ok(body.includes('status_code="200"'), 'Must record 200 status code');
    } finally {
      await app.close();
    }
  });
});
