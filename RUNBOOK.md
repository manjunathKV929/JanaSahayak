# JanaSahayak — Production Operations & Incident Runbook

> **Target Audience**: SREs, DevOps Engineers, On-Call Software Engineers, and Security Leads.  
> **System**: JanaSahayak Public Service Guidance Platform  
> **Classification**: Internal / Operational Runbook  

---

## 1. System Overview & Boundaries

JanaSahayak is an accessibility-first, multilingual civic guidance platform assisting citizens in discovering government schemes, evaluating eligibility, understanding document dependencies, and navigating step-by-step application journeys.

### Core Architectural Boundaries
1. **Guidance Layer Only**: JanaSahayak is **NOT** a government authority and **NOT** a replacement for official portals. Citizens are always directed to verified government portals (e.g., `sevasindhu.karnataka.gov.in`, `karnatakaone.gov.in`, `bangaloreone.gov.in`).
2. **Zero PII Storage Guarantee**:
   - No citizen identifiers (Aadhaar numbers, PAN numbers, bank accounts, OTPs, biometric data) are ever stored in the database, logged, or transmitted to AI providers.
   - Family mode evaluations and eligibility questionnaire answers are computed deterministically in-memory and discarded.
3. **Core Services**:
   - `apps/web`: Next.js 15 (App Router), progressive web app (PWA), SSR/SSG with client offline fallback.
   - `services/api`: Fastify 5 REST API under `/api/v1`, OpenAPI 3.1.0, Prometheus metrics exporter.
   - `packages/db`: PostgreSQL 16 with `pgvector` extension, connection pooling with TLS.
   - `packages/ai`: Grounded RAG orchestrator with strict PII guard and conservative localized refusal policies.

---

## 2. Service Level Objectives (SLOs) & SLAs

| Metric | Target SLO | Monitoring Indicator | Violation Severity |
| :--- | :--- | :--- | :--- |
| **API Availability** | $\ge 99.9\%$ monthly | `rate(janasahayak_http_requests_total{status_code=~"5.."}[5m]) / rate(janasahayak_http_requests_total[5m]) < 0.001` | SEV-1 |
| **Catalogue Latency (p95)** | $\le 100\text{ ms}$ | `histogram_quantile(0.95, rate(janasahayak_http_request_duration_seconds_bucket{route="/api/v1/services"}[5m]))` | SEV-2 |
| **Eligibility Eval Latency (p95)** | $\le 150\text{ ms}$ | `histogram_quantile(0.95, rate(janasahayak_http_request_duration_seconds_bucket{route=~".*eligibility.*"}[5m]))` | SEV-2 |
| **Database Pool Saturation** | $\le 80\%$ active | `janasahayak_db_pool_connections{state="active"} / janasahayak_db_pool_connections{state="total"}` | SEV-2 |
| **Citizen PII Ingestion** | $0$ records | Any unredacted Aadhaar/PAN pattern discovered in database or logs | **SEV-1 (Critical)** |
| **Recovery Point Objective (RPO)** | $\le 1\text{ hour}$ | Timestamp of latest validated automated backup snapshot | SEV-2 |
| **Recovery Time Objective (RTO)** | $\le 15\text{ minutes}$ | Total duration from database disaster to restore drill verification | SEV-1 |

---

## 3. Incident Severity Classification Matrix

| Severity | Description | Target Initial Response | Escalation Cadence | Examples |
| :--- | :--- | :--- | :--- | :--- |
| **SEV-1 (Critical)** | Catastrophic outage; site unavailable; security breach; citizen PII exposure. | $< 15\text{ minutes}$ | Update every 30 mins to stakeholders | Database crash; TLS cert expired; 5xx rate $> 5\%$. |
| **SEV-2 (Major)** | Major core feature failure with degraded citizen experience; no viable workaround. | $< 30\text{ minutes}$ | Update every 60 mins | Search engine failing; eligibility engine 500s; rate-limiter tripping legitimate users. |
| **SEV-3 (Moderate)** | Non-critical feature degraded; acceptable workaround exists. | $< 2\text{ hours}$ | Business day resolution | TTS audio synthesis failing on web; location desk filtering returning slow queries. |
| **SEV-4 (Minor)** | Minor UI anomaly, documentation typo, or cosmetic layout glitch. | $< 24\text{ hours}$ | Next scheduled sprint release | Missing translation for newly added scheme tag; non-blocking styling issue. |

---

## 4. Observability, Health Probes & Alerting

### Health & Readiness Endpoints
- **Liveness Probe**: `GET /api/v1/health`
  - Returns `200 OK` with `{ status: "ok", timestamp: "..." }`.
  - Probes process event loop responsiveness.
- **Readiness Probe**: `GET /api/v1/ready`
  - Returns `200 OK` when PostgreSQL database pool is reachable.
  - Returns `503 Service Unavailable` with `{ error: { code: "SERVICE_UNAVAILABLE" } }` if DB connection fails.
- **Metrics Endpoint**: `GET /api/v1/metrics`
  - Returns Prometheus 0.0.4 plaintext exposition format.
  - No caching (`Cache-Control: no-store, private`).

### Prometheus Alerting Rules Template
```yaml
groups:
  - name: janasahayak_alerts
    rules:
      - alert: HighHttp5xxRate
        expr: sum(rate(janasahayak_http_requests_total{status_code=~"5.."}[5m])) / sum(rate(janasahayak_http_requests_total[5m])) > 0.02
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "JanaSahayak 5xx error rate exceeds 2%"

      - alert: DatabasePoolSaturated
        expr: janasahayak_db_pool_connections{state="waiting"} > 5
        for: 1m
        labels:
          severity: warning
        annotations:
          summary: "JanaSahayak PostgreSQL connection pool waiting queue > 5"

      - alert: ApiLatencyDegraded
        expr: histogram_quantile(0.95, sum(rate(janasahayak_http_request_duration_seconds_bucket[5m])) by (le)) > 0.5
        for: 3m
        labels:
          severity: warning
        annotations:
          summary: "p95 API latency exceeds 500ms"
```

---

## 5. Operational Incident Playbooks

### Playbook 1: Database Connection Pool Exhaustion / High DB Latency
**Symptoms**:
- HTTP 503 errors on `/api/v1/ready`.
- `janasahayak_db_pool_connections{state="waiting"}` spikes.
- PostgreSQL logs report `remaining connection slots are reserved for non-replication superuser connections`.

**Investigation**:
1. Check pool metrics:
   ```bash
   curl -s http://localhost:3001/api/v1/metrics | grep janasahayak_db_pool_connections
   ```
2. Inspect active PostgreSQL queries:
   ```sql
   SELECT pid, now() - query_start AS duration, query, state
   FROM pg_stat_activity
   WHERE state != 'idle' AND query NOT ILIKE '%pg_stat_activity%'
   ORDER BY duration DESC;
   ```
3. Terminate hung backend process if a runaway transaction locks rows:
   ```sql
   SELECT pg_terminate_backend(<pid>);
   ```

**Remediation**:
- In `docker-compose.prod.yml` or container environment, temporarily increment `DATABASE_MAX_CONNECTIONS` (default: 25) up to 50 if DB server has sufficient RAM:
  ```bash
  DATABASE_MAX_CONNECTIONS=50 docker compose -f docker-compose.prod.yml up -d api
  ```
- Ensure connection pool timeout is configured: `DATABASE_CONNECTION_TIMEOUT_MS=10000`.

---

### Playbook 2: Traffic Surge & Rate-Limit Triggering (e.g. Welfare Scheme Launch)
**Symptoms**:
- Citizens reporting HTTP 429 (`RATE_LIMITED`).
- Sudden spike in requests due to viral government announcement or scholarship deadline.

**Investigation**:
1. Inspect request rates and top routes:
   ```bash
   curl -s http://localhost:3001/api/v1/metrics | grep janasahayak_http_requests_total
   ```
2. Verify whether traffic is legitimate citizen queries or malicious volumetric scraping.

**Remediation**:
- For legitimate traffic surges, adjust rate-limiting environment variables dynamically:
  ```bash
  API_RATE_LIMIT_MAX=500 docker compose -f docker-compose.prod.yml up -d api
  ```
- Enable Edge CDN caching for public read routes (`/api/v1/services`, `/api/v1/deadlines`, `/api/v1/locations`) on Cloudflare / CloudFront with `s-maxage=300`.
- Scale API service horizontally:
  ```bash
  docker compose -f docker-compose.prod.yml up -d --scale api=3
  ```

---

### Playbook 3: Node Process Out-of-Memory (OOM) & Restart Loops
**Symptoms**:
- Container restarts unexpectedly (`Exit Code 137` - OOMKilled).
- `janasahayak_process_resident_memory_bytes` continuously trends upward without stabilizing after garbage collection.

**Investigation**:
1. Monitor memory metrics:
   ```bash
   curl -s http://localhost:3001/api/v1/metrics | grep janasahayak_process_resident_memory_bytes
   ```
2. Check container restart count:
   ```bash
   docker ps --filter "name=janasahayak"
   ```

**Remediation**:
- Increase Node.js heap limit:
  ```bash
  NODE_OPTIONS="--max-old-space-size=2048"
  ```
- Adjust Docker memory limits in `docker-compose.prod.yml`:
  ```yaml
  deploy:
    resources:
      limits:
        memory: 3072M
  ```
- Inspect recent releases for event listener leaks, unclosed streams, or unbounded in-memory caches.

---

### Playbook 4: Bhashini AI / External Provider Degradation
**Symptoms**:
- AI search interpretation (`/api/v1/ai/interpret`) or conversational assistance latency $> 5\text{s}$.
- External provider returning HTTP 502/504 or rate-limit errors.

**Remediation**:
- The platform is designed with **Deterministic Rule Superiority**:
  - The deterministic catalogue, keyword search, rule evaluator, and document checklist **DO NOT** depend on Bhashini or AI models.
  - Citizens can continue using keyword search and deterministic questionnaires without degradation.
- Switch to offline fallback / mock provider if Bhashini is experiencing upstream downtime:
  ```bash
  AI_PROVIDER=mock docker compose -f docker-compose.prod.yml up -d api
  ```
- Verify `PIIGuard` continues scrubbing inputs before external calls.

---

### Playbook 5: Data Corruption or Accidental Scheme Deprecation
**Symptoms**:
- An active scheme (e.g. Gruha Lakshmi) was accidentally marked `DEPRECATED` or draft changes overwritten.
- Corrupted eligibility rule logic causes false ineligibility verdicts.

**Investigation**:
1. Inspect immutable audit log to find author and timestamp:
   ```sql
   SELECT id, entity_type, entity_id, action, actor_id, changes, created_at
   FROM audit_logs
   WHERE entity_id = '<service_id>'
   ORDER BY created_at DESC
   LIMIT 10;
   ```
2. Check previous version history in `service_versions`:
   ```sql
   SELECT id, service_id, version_number, content, approved_by, created_at
   FROM service_versions
   WHERE service_id = '<service_id>'
   ORDER BY version_number DESC;
   ```

**Remediation**:
- Revert the current version pointer or re-publish the verified previous version using the Admin Content API (`POST /api/v1/admin/services/:id/publish`).
- If wide-scale database corruption occurs, execute point-in-time recovery via Section 6.

---

### Playbook 6: Secret Rotation Runbook (Zero-Downtime)

#### A. Database Credentials Rotation
1. Create a secondary database user with identical permissions in PostgreSQL:
   ```sql
   CREATE USER janasahayak_app_v2 WITH PASSWORD '<new_strong_password>';
   GRANT ALL PRIVILEGES ON DATABASE janasahayak_prod TO janasahayak_app_v2;
   GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO janasahayak_app_v2;
   GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO janasahayak_app_v2;
   ```
2. Update `DATABASE_URL` in Vault / production environment to `janasahayak_app_v2`.
3. Perform a rolling restart of API containers:
   ```bash
   docker compose -f docker-compose.prod.yml up -d --no-deps api
   ```
4. Verify `/api/v1/ready` returns 200 OK.
5. Revoke and drop old database user:
   ```sql
   DROP USER janasahayak_app;
   ```

#### B. Session Secret (`SESSION_SECRET`) Rotation
1. Generate a cryptographically secure 64-character secret:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
2. Update the secret in Vault / Secret Manager.
3. Restart API service. Note: Active admin sessions will be required to re-authenticate. Public citizen browsing is stateless and unaffected.

---

## 6. Disaster Recovery & Backup/Restore Procedures

### Automated Backup Procedure
JanaSahayak provides an automated snapshot utility generating compressed, timestamped, and SHA-256 checksummed backups of all transactional tables.

```bash
# Execute snapshot backup
npm run db:backup
```
- **Output Artifacts**:
  - `backups/janasahayak-backup-YYYY-MM-DDTHH-MM-SS.json.gz` (Gzip compressed JSON bundle)
  - `backups/janasahayak-backup-YYYY-MM-DDTHH-MM-SS.json.gz.sha256` (Cryptographic verification checksum)
- **Tables Captured**: `categories`, `services`, `sources`, `service_sources`, `documents`, `service_documents`, `document_issuers`, `eligibility_rules`, `eligibility_questions`, `journey_templates`, `journey_steps`, `service_translations`, `locations`, `service_locations`, `deadlines`, `reviews`, `audit_logs`, `schema_migrations`.

### Backup Verification & Offsite Replication
```bash
# Verify checksum integrity
sha256sum -c backups/janasahayak-backup-YYYY-MM-DDTHH-MM-SS.json.gz.sha256
```
- In cloud deployments, the backup script runs via cron job (`0 * * * *`) and uploads snapshots to an encrypted, immutable S3 bucket with Object Lock (WORM).

### Disaster Restore Drill Procedure
In the event of database failure or corrupted state:
```bash
# Execute restore drill from validated snapshot
npm run db:restore backups/janasahayak-backup-YYYY-MM-DDTHH-MM-SS.json.gz
```
- **Execution Safeguards**:
  1. Decompresses and validates SHA-256 checksum against `.sha256` manifest.
  2. Initiates a single atomic PostgreSQL transaction (`BEGIN`).
  3. Restores tables in strict foreign-key dependency order.
  4. Computes row counts and verifies integrity against bundle metadata.
  5. If any constraint fails, the entire transaction automatically rolls back (`ROLLBACK`), preventing partial restores.
  6. On success, commits transaction (`COMMIT`) and logs restoration duration and row count summary.

---

## 7. Deployment & Zero-Downtime Rollback

### Production Deployment Procedure
1. **Pre-flight Checks**:
   ```bash
   npm run typecheck
   npm run lint
   npm run test
   npm run openapi:validate
   npm run test:load
   ```
2. **Execute Database Migrations**:
   ```bash
   npm run db:migrate
   ```
3. **Build & Deploy Containers**:
   ```bash
   docker compose -f docker-compose.prod.yml build
   docker compose -f docker-compose.prod.yml up -d --remove-orphans
   ```
4. **Post-Deployment Verification**:
   ```bash
   curl -f https://janasahayak.gov.in/api/v1/health
   curl -f https://janasahayak.gov.in/api/v1/ready
   curl -f https://janasahayak.gov.in/api/v1/metrics
   ```

### Emergency Zero-Downtime Rollback
If a newly deployed version exhibits unforeseen defects:
1. Revert container image tags to the previous stable release commit (e.g. `IMAGE_TAG=f4a635d`):
   ```bash
   IMAGE_TAG=f4a635d docker compose -f docker-compose.prod.yml up -d --no-deps api web
   ```
2. Verify `/api/v1/health` and `/api/v1/ready` return 200 OK.
3. If database schema was migrated, check whether migrations are backward-compatible. All JanaSahayak migrations use additive schemas to guarantee zero-downtime rollbacks.

---

## 8. Incident Post-Mortem Template

```markdown
# Incident Post-Mortem: [Brief Title]

- **Date**: YYYY-MM-DD
- **Severity**: SEV-[1/2/3]
- **Duration**: [XX minutes]
- **Incident Lead**: [Name]
- **Impact**: [Number of citizens affected / error rate spike]

## Timeline (UTC)
- HH:MM - Alert triggered / incident reported
- HH:MM - On-call engineer acknowledged and opened incident channel
- HH:MM - Root cause identified
- HH:MM - Mitigation applied
- HH:MM - System verified healthy; incident closed

## Root Cause
[Technical explanation of what triggered the failure]

## What Went Well
- [Alert fired within 2 minutes]
- [Zero PII compromised]

## What Could Be Improved
- [Improve dashboard visibility into ...]

## Action Items
1. [Preventative code fix or architectural hardening] — Owner: [Name] (Due: YYYY-MM-DD)
2. [Add automated test case reproducing issue] — Owner: [Name] (Due: YYYY-MM-DD)
```
