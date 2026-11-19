import { Pool, type PoolConfig } from 'pg';

export interface DatabaseClientOptions {
  connectionString: string;
  ssl: boolean;
  maxConnections?: number;
  connectionTimeoutMs?: number;
  idleTimeoutMs?: number;
}

export interface Queryable {
  query: (text: string, values?: readonly unknown[]) => Promise<{ rows: unknown[] }>;
}

export function buildPoolConfig(options: DatabaseClientOptions): PoolConfig {
  return {
    connectionString: options.connectionString,
    // Always verify TLS certificates when SSL is enabled (never rejectUnauthorized: false).
    ssl: options.ssl ? { rejectUnauthorized: true } : false,
    max: options.maxConnections ?? 10,
    connectionTimeoutMillis: options.connectionTimeoutMs ?? 5000,
    idleTimeoutMillis: options.idleTimeoutMs ?? 30000,
  };
}

export function createDatabasePool(options: DatabaseClientOptions): Pool {
  return new Pool(buildPoolConfig(options));
}

export async function checkDatabaseHealth(client: Queryable): Promise<boolean> {
  try {
    await client.query('SELECT 1 AS ok');
    return true;
  } catch {
    return false;
  }
}
