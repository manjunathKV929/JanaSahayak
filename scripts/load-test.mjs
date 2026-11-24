import { performance } from 'node:perf_hooks';
import process from 'node:process';
import { loadApiEnv } from '../packages/config/src/index.js';
import { buildApp } from '../services/api/src/app.js';

function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function runScenario(app, scenario) {
  const t0 = performance.now();
  const res = await app.inject(scenario.req);
  const duration = performance.now() - t0;
  return {
    name: scenario.name,
    statusCode: res.statusCode,
    durationMs: duration,
    success: res.statusCode >= 200 && res.statusCode < 400,
  };
}

async function runBenchmark() {
  process.stdout.write('=========================================================\n');
  process.stdout.write('  JanaSahayak Production Load & Concurrency Benchmark   \n');
  process.stdout.write('=========================================================\n\n');

  const env = loadApiEnv({
    NODE_ENV: 'test',
    API_CORS_ORIGINS: 'http://localhost:3000',
    API_RATE_LIMIT_MAX: 10000,
  });

  const app = await buildApp({
    env,
    logger: false,
    checkDatabase: async () => 'up',
    db: {
      query: async (sql) => {
        if (sql.includes('deadlines')) {
          return {
            rows: [
              {
                id: 'dl-1',
                service_id: 'srv-gruha-lakshmi-001',
                service_slug: 'karnataka-gruha-lakshmi',
                service_title: 'Gruha Lakshmi Scheme',
                category: 'WELFARE',
                state_code: 'KA',
                name: 'Annual Verification',
                opens_at: new Date('2026-01-01T00:00:00Z'),
                closes_at: new Date('2026-12-31T23:59:59Z'),
                status: 'OPEN',
                source_url: 'https://sevasindhu.karnataka.gov.in',
                publisher: 'Karnataka Govt',
                last_verified_at: new Date('2026-01-01T00:00:00Z'),
              },
            ],
          };
        }
        if (sql.includes('locations')) {
          return {
            rows: [
              {
                id: 'loc-1',
                name: 'Bangalore One - Jayanagar',
                center_type: 'BANGALORE_ONE',
                address: '9th Main, 4th Block, Jayanagar',
                district: 'Bangalore Urban',
                taluk: 'Bangalore South',
                state_code: 'KA',
                pincode: '560011',
                latitude: 12.9298,
                longitude: 77.5834,
                contact_phone: '080-22221111',
                operating_hours: '08:00 - 19:00',
                verified_source_url: 'https://karnatakaone.gov.in',
                is_active: true,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                services_json: [
                  {
                    service_id: 'srv-gruha-lakshmi-001',
                    slug: 'karnataka-gruha-lakshmi',
                    title: 'Gruha Lakshmi Scheme',
                    assistance_type: 'ASSISTED_APPLICATION',
                  },
                ],
              },
            ],
          };
        }
        if (sql.includes('eligibility_questions')) {
          return {
            rows: [
              {
                id: 'q-1',
                service_id: 'srv-gruha-lakshmi-001',
                key: 'gender',
                question_text: { en: 'What is your gender?' },
                answer_type: 'SINGLE_CHOICE',
                required: true,
                display_order: 1,
              },
            ],
          };
        }
        if (sql.includes('eligibility_options')) {
          return {
            rows: [
              {
                id: 'opt-1',
                question_id: 'q-1',
                key: 'female',
                label: { en: 'Female' },
                display_order: 1,
              },
            ],
          };
        }
        if (sql.includes('eligibility_rules')) {
          return {
            rows: [
              {
                id: 'er-1',
                service_id: 'srv-gruha-lakshmi-001',
                name: 'Woman Head of Family',
                rule_expression: {
                  field: 'gender',
                  operator: 'EQUALS',
                  value: 'female',
                },
                explanation: { en: 'You must identify as a woman' },
                priority: 1,
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          };
        }
        if (sql.includes('service_versions')) {
          return {
            rows: [
              {
                id: 'ver-1',
                service_id: 'srv-gruha-lakshmi-001',
                version_number: 1,
                content: {
                  title: 'Gruha Lakshmi Scheme',
                  shortDescription: 'Direct monthly financial assistance',
                  fullDescription: 'Provides Rs 2,000 monthly to woman head of household',
                  officialPortalUrl: 'https://sevasindhu.karnataka.gov.in',
                  statutoryFee: { isFree: true, amount: 0, currency: 'INR' },
                },
                language: 'en',
                effective_from: new Date(),
                effective_to: null,
                created_by: 'admin-1',
                approved_by: 'reviewer-1',
                created_at: new Date(),
              },
            ],
          };
        }
        if (sql.includes('COUNT(*) AS total')) {
          return { rows: [{ total: 1 }] };
        }
        if (sql.includes('service_records') && sql.includes('service_sources')) {
          return {
            rows: [
              {
                id: 'srv-gruha-lakshmi-001',
                slug: 'karnataka-gruha-lakshmi',
                service_type: 'WELFARE',
                title: 'Gruha Lakshmi Scheme',
                short_description: 'Direct monthly benefit for woman head of family',
                department_name: 'Department of Women & Child Development',
                state_code: 'KA',
                status: 'PUBLISHED',
                updated_at: new Date(),
                verification_status: 'VERIFIED',
                last_verified_at: new Date(),
              },
            ],
          };
        }
        if (sql.includes('service_records')) {
          return {
            rows: [
              {
                id: 'srv-gruha-lakshmi-001',
                slug: 'karnataka-gruha-lakshmi',
                service_type: 'WELFARE',
                title: 'Gruha Lakshmi Scheme',
                short_description: 'Direct monthly benefit for woman head of family',
                department_name: 'Department of Women & Child Development',
                state_code: 'KA',
                status: 'PUBLISHED',
                current_version_id: 'ver-1',
                created_at: new Date(),
                updated_at: new Date(),
              },
            ],
          };
        }
        return { rows: [] };
      },
    },
  });

  await app.ready();

  const scenarios = [
    { name: 'GET /health', req: { method: 'GET', url: '/api/v1/health' } },
    { name: 'GET /services', req: { method: 'GET', url: '/api/v1/services' } },
    {
      name: 'GET /services/:slug',
      req: { method: 'GET', url: '/api/v1/services/karnataka-gruha-lakshmi' },
    },
    { name: 'GET /deadlines', req: { method: 'GET', url: '/api/v1/deadlines' } },
    { name: 'GET /locations', req: { method: 'GET', url: '/api/v1/locations?district=Bangalore' } },
    {
      name: 'POST /eligibility/evaluate',
      req: {
        method: 'POST',
        url: '/api/v1/services/srv-gruha-lakshmi-001/eligibility/evaluate',
        payload: {
          answers: { gender: 'female', isHeadOfFamily: true },
        },
      },
    },
    {
      name: 'POST /family/scan',
      req: {
        method: 'POST',
        url: '/api/v1/family/scan',
        payload: {
          district: 'Bangalore Urban',
          annualFamilyIncome: 150000,
          members: [
            {
              id: 'm-1',
              name: 'Radha',
              relationship: 'SELF',
              age: 38,
              gender: 'FEMALE',
              isHeadOfFamily: true,
            },
            {
              id: 'm-2',
              name: 'Rohan',
              relationship: 'CHILD',
              age: 19,
              gender: 'MALE',
              isStudent: true,
            },
          ],
        },
      },
    },
    { name: 'GET /metrics', req: { method: 'GET', url: '/api/v1/metrics' } },
  ];

  const totalBatches = 15;
  const concurrency = 8;
  const allResults = [];

  process.stdout.write(
    `Executing concurrent batches (${totalBatches} iterations x ${scenarios.length} endpoints, concurrency=${concurrency})...\n\n`,
  );
  const benchmarkStart = performance.now();

  for (let batch = 0; batch < totalBatches; batch++) {
    const promises = [];
    for (const scenario of scenarios) {
      promises.push(runScenario(app, scenario));
    }
    const batchResults = await Promise.all(promises);
    allResults.push(...batchResults);
  }

  const totalBenchmarkDurationMs = performance.now() - benchmarkStart;
  await app.close();

  const latencies = allResults.map((r) => r.durationMs).sort((a, b) => a - b);
  const successCount = allResults.filter((r) => r.success).length;
  const failureCount = allResults.length - successCount;
  const rps = ((allResults.length / totalBenchmarkDurationMs) * 1000).toFixed(1);

  const avgLatency = (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2);
  const p50 = percentile(latencies, 50).toFixed(2);
  const p90 = percentile(latencies, 90).toFixed(2);
  const p95 = percentile(latencies, 95).toFixed(2);
  const p99 = percentile(latencies, 99).toFixed(2);
  const maxLat = Math.max(...latencies).toFixed(2);
  const minLat = Math.min(...latencies).toFixed(2);

  process.stdout.write('---------------------------------------------------------\n');
  process.stdout.write(`  Total Requests Executed:  ${allResults.length}\n`);
  process.stdout.write(`  Total Wall Time:          ${totalBenchmarkDurationMs.toFixed(2)} ms\n`);
  process.stdout.write(`  Throughput (RPS):         ${rps} req/sec\n`);
  process.stdout.write(
    `  Successful Requests:      ${successCount} (${((successCount / allResults.length) * 100).toFixed(1)}%)\n`,
  );
  process.stdout.write(`  Failed Requests:          ${failureCount}\n`);
  process.stdout.write('---------------------------------------------------------\n');
  process.stdout.write(`  Min Latency:              ${minLat} ms\n`);
  process.stdout.write(`  Avg Latency:              ${avgLatency} ms\n`);
  process.stdout.write(`  Median (p50) Latency:     ${p50} ms\n`);
  process.stdout.write(`  90th Percentile (p90):    ${p90} ms\n`);
  process.stdout.write(`  95th Percentile (p95):    ${p95} ms\n`);
  process.stdout.write(`  99th Percentile (p99):    ${p99} ms\n`);
  process.stdout.write(`  Max Latency:              ${maxLat} ms\n`);
  process.stdout.write('=========================================================\n');

  if (failureCount > 0) {
    throw new Error(`Benchmark failed: ${failureCount} requests failed!`);
  }

  process.stdout.write('Load benchmark passed all criteria with 0 errors!\n\n');
}

runBenchmark().catch((err) => {
  process.stderr.write(`Benchmark error: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
