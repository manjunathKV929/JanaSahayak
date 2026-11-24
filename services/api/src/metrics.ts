export const LATENCY_BUCKETS = [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10] as const;

export interface DbPoolStats {
  total: number;
  idle: number;
  active: number;
  waiting: number;
}

export class MetricsRegistry {
  private httpRequests = new Map<string, number>();
  private httpLatencyBuckets = new Map<string, number>();
  private httpLatencySum = new Map<string, number>();
  private httpLatencyCount = new Map<string, number>();
  private aiQueries = new Map<string, number>();
  private eligibilityEvaluations = new Map<string, number>();
  private dbPoolStats: DbPoolStats = { total: 0, idle: 0, active: 0, waiting: 0 };
  private startTime = Date.now();

  private sanitizeLabelValue(value: string): string {
    return value.replace(/"/g, '\\"').replace(/\n/g, '');
  }

  public recordHttpRequest(
    method: string,
    route: string,
    statusCode: number,
    durationSeconds: number,
  ): void {
    const safeMethod = this.sanitizeLabelValue(method);
    const safeRoute = this.sanitizeLabelValue(route || 'unmatched');
    const statusStr = String(statusCode);

    // Increment request counter
    const counterKey = `method="${safeMethod}",route="${safeRoute}",status_code="${statusStr}"`;
    this.httpRequests.set(counterKey, (this.httpRequests.get(counterKey) ?? 0) + 1);

    // Record latency histogram
    const histogramKey = `method="${safeMethod}",route="${safeRoute}"`;
    this.httpLatencyCount.set(histogramKey, (this.httpLatencyCount.get(histogramKey) ?? 0) + 1);
    this.httpLatencySum.set(
      histogramKey,
      (this.httpLatencySum.get(histogramKey) ?? 0) + durationSeconds,
    );

    for (const le of LATENCY_BUCKETS) {
      if (durationSeconds <= le) {
        const bucketKey = `${histogramKey},le="${le}"`;
        this.httpLatencyBuckets.set(bucketKey, (this.httpLatencyBuckets.get(bucketKey) ?? 0) + 1);
      }
    }
    // +Inf bucket counts all
    const infKey = `${histogramKey},le="+Inf"`;
    this.httpLatencyBuckets.set(infKey, (this.httpLatencyBuckets.get(infKey) ?? 0) + 1);
  }

  public recordAiQuery(type: 'search' | 'assist'): void {
    const safeType = this.sanitizeLabelValue(type);
    const key = `type="${safeType}"`;
    this.aiQueries.set(key, (this.aiQueries.get(key) ?? 0) + 1);
  }

  public recordEligibilityEvaluation(verdict: 'eligible' | 'ineligible' | 'uncertain'): void {
    const safeVerdict = this.sanitizeLabelValue(verdict);
    const key = `verdict="${safeVerdict}"`;
    this.eligibilityEvaluations.set(key, (this.eligibilityEvaluations.get(key) ?? 0) + 1);
  }

  public setDbPoolStats(stats: DbPoolStats): void {
    this.dbPoolStats = { ...stats };
  }

  public reset(): void {
    this.httpRequests.clear();
    this.httpLatencyBuckets.clear();
    this.httpLatencySum.clear();
    this.httpLatencyCount.clear();
    this.aiQueries.clear();
    this.eligibilityEvaluations.clear();
    this.dbPoolStats = { total: 0, idle: 0, active: 0, waiting: 0 };
    this.startTime = Date.now();
  }

  public renderPrometheusText(): string {
    const lines: string[] = [];

    // Process & Runtime Metrics
    lines.push('# HELP janasahayak_process_uptime_seconds Process uptime in seconds');
    lines.push('# TYPE janasahayak_process_uptime_seconds gauge');
    const uptimeSec = ((Date.now() - this.startTime) / 1000).toFixed(3);
    lines.push(`janasahayak_process_uptime_seconds ${uptimeSec}`);

    const mem = process.memoryUsage();
    lines.push('# HELP janasahayak_process_resident_memory_bytes Resident memory size in bytes');
    lines.push('# TYPE janasahayak_process_resident_memory_bytes gauge');
    lines.push(`janasahayak_process_resident_memory_bytes ${mem.rss}`);

    // HTTP Request Counter
    lines.push('# HELP janasahayak_http_requests_total Total number of HTTP requests processed');
    lines.push('# TYPE janasahayak_http_requests_total counter');
    if (this.httpRequests.size === 0) {
      lines.push('janasahayak_http_requests_total 0');
    } else {
      for (const [labels, count] of this.httpRequests.entries()) {
        lines.push(`janasahayak_http_requests_total{${labels}} ${count}`);
      }
    }

    // HTTP Request Duration Histogram
    lines.push('# HELP janasahayak_http_request_duration_seconds HTTP request duration in seconds');
    lines.push('# TYPE janasahayak_http_request_duration_seconds histogram');
    for (const [routeLabels, count] of this.httpLatencyCount.entries()) {
      for (const le of LATENCY_BUCKETS) {
        const bucketKey = `${routeLabels},le="${le}"`;
        const bCount = this.httpLatencyBuckets.get(bucketKey) ?? 0;
        lines.push(`janasahayak_http_request_duration_seconds_bucket{${bucketKey}} ${bCount}`);
      }
      const infKey = `${routeLabels},le="+Inf"`;
      const infCount = this.httpLatencyBuckets.get(infKey) ?? count;
      lines.push(`janasahayak_http_request_duration_seconds_bucket{${infKey}} ${infCount}`);
      const sum = (this.httpLatencySum.get(routeLabels) ?? 0).toFixed(6);
      lines.push(`janasahayak_http_request_duration_seconds_sum{${routeLabels}} ${sum}`);
      lines.push(`janasahayak_http_request_duration_seconds_count{${routeLabels}} ${count}`);
    }

    // DB Pool Stats
    lines.push(
      '# HELP janasahayak_db_pool_connections PostgreSQL connection pool connections by state',
    );
    lines.push('# TYPE janasahayak_db_pool_connections gauge');
    lines.push(`janasahayak_db_pool_connections{state="total"} ${this.dbPoolStats.total}`);
    lines.push(`janasahayak_db_pool_connections{state="idle"} ${this.dbPoolStats.idle}`);
    lines.push(`janasahayak_db_pool_connections{state="active"} ${this.dbPoolStats.active}`);
    lines.push(`janasahayak_db_pool_connections{state="waiting"} ${this.dbPoolStats.waiting}`);

    // AI Queries
    lines.push('# HELP janasahayak_ai_queries_total Total AI query interpretations and assists');
    lines.push('# TYPE janasahayak_ai_queries_total counter');
    if (this.aiQueries.size === 0) {
      lines.push('janasahayak_ai_queries_total 0');
    } else {
      for (const [labels, count] of this.aiQueries.entries()) {
        lines.push(`janasahayak_ai_queries_total{${labels}} ${count}`);
      }
    }

    // Eligibility Evaluations
    lines.push('# HELP janasahayak_eligibility_evaluations_total Total eligibility evaluations');
    lines.push('# TYPE janasahayak_eligibility_evaluations_total counter');
    if (this.eligibilityEvaluations.size === 0) {
      lines.push('janasahayak_eligibility_evaluations_total 0');
    } else {
      for (const [labels, count] of this.eligibilityEvaluations.entries()) {
        lines.push(`janasahayak_eligibility_evaluations_total{${labels}} ${count}`);
      }
    }

    return lines.join('\n') + '\n';
  }
}

export const defaultMetricsRegistry = new MetricsRegistry();
