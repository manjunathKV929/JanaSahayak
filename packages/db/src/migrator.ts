import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Pool, PoolClient } from 'pg';

export interface MigrationFile {
  name: string;
  sql: string;
  checksum: string;
}

export interface MigrationResult {
  applied: string[];
  skipped: string[];
}

export function getDefaultMigrationsDir(): string {
  const currentDir = path.dirname(fileURLToPath(import.meta.url));
  return path.resolve(currentDir, '../migrations');
}

export async function loadMigrationFiles(migrationsDir: string): Promise<MigrationFile[]> {
  const entries = await fs.readdir(migrationsDir, { withFileTypes: true });
  const sqlFiles = entries
    .filter((entry) => entry.isFile() && entry.name.endsWith('.sql'))
    .map((entry) => entry.name)
    .sort((a, b) => a.localeCompare(b));

  const migrations: MigrationFile[] = [];
  for (const name of sqlFiles) {
    const filePath = path.join(migrationsDir, name);
    const sql = await fs.readFile(filePath, 'utf8');
    const checksum = crypto.createHash('sha256').update(sql, 'utf8').digest('hex');
    migrations.push({ name, sql, checksum });
  }
  return migrations;
}

export interface MigrationClient {
  query: (
    text: string,
    values?: readonly unknown[],
  ) => Promise<{ rows: Record<string, unknown>[] }>;
  release: () => void;
}

export interface MigrationPool {
  connect: () => Promise<MigrationClient>;
}

export async function runMigrations(
  pool: Pick<Pool, 'connect'> | MigrationPool,
  migrationsDir: string = getDefaultMigrationsDir(),
): Promise<MigrationResult> {
  const migrations = await loadMigrationFiles(migrationsDir);
  const client = (await pool.connect()) as PoolClient | MigrationClient;
  const applied: string[] = [];
  const skipped: string[] = [];

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        name TEXT PRIMARY KEY,
        checksum TEXT NOT NULL,
        applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);

    const existing = await client.query('SELECT name, checksum FROM schema_migrations');
    const existingByName = new Map<string, string>();
    for (const row of existing.rows) {
      if (typeof row.name === 'string' && typeof row.checksum === 'string') {
        existingByName.set(row.name, row.checksum);
      }
    }

    for (const migration of migrations) {
      const priorChecksum = existingByName.get(migration.name);
      if (priorChecksum !== undefined) {
        if (priorChecksum !== migration.checksum) {
          throw new Error(
            `Migration checksum mismatch for ${migration.name}: applied file was modified`,
          );
        }
        skipped.push(migration.name);
        continue;
      }

      await client.query('BEGIN');
      try {
        await client.query(migration.sql);
        await client.query('INSERT INTO schema_migrations (name, checksum) VALUES ($1, $2)', [
          migration.name,
          migration.checksum,
        ]);
        await client.query('COMMIT');
        applied.push(migration.name);
      } catch (error) {
        await client.query('ROLLBACK');
        throw error;
      }
    }
  } finally {
    client.release();
  }

  return { applied, skipped };
}
