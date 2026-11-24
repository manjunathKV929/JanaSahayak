import crypto from 'node:crypto';
import zlib from 'node:zlib';
import type { Queryable } from './client.js';

export const BACKUP_TABLES = [
  'categories',
  'services',
  'sources',
  'service_sources',
  'documents',
  'service_documents',
  'document_issuers',
  'eligibility_rules',
  'eligibility_questions',
  'journey_templates',
  'journey_steps',
  'service_translations',
  'locations',
  'service_locations',
  'deadlines',
  'reviews',
  'audit_logs',
  'schema_migrations',
] as const;

export type BackupTableName = (typeof BACKUP_TABLES)[number];

export interface BackupBundle {
  formatVersion: '1.0.0';
  createdAt: string;
  system: 'JanaSahayak';
  tableCounts: Record<string, number>;
  data: Record<string, Array<Record<string, unknown>>>;
}

export interface RestoreResult {
  success: boolean;
  restoredTables: string[];
  restoredRows: Record<string, number>;
  durationMs: number;
}

export async function createDatabaseBackup(
  client: Queryable,
  tables: readonly BackupTableName[] = BACKUP_TABLES,
): Promise<BackupBundle> {
  const tableCounts: Record<string, number> = {};
  const data: Record<string, Array<Record<string, unknown>>> = {};

  for (const table of tables) {
    try {
      const res = await client.query(`SELECT * FROM ${table};`);
      const rows = res.rows as Array<Record<string, unknown>>;
      data[table] = rows;
      tableCounts[table] = rows.length;
    } catch {
      // If a table does not exist or has not been migrated yet, record 0
      data[table] = [];
      tableCounts[table] = 0;
    }
  }

  return {
    formatVersion: '1.0.0',
    createdAt: new Date().toISOString(),
    system: 'JanaSahayak',
    tableCounts,
    data,
  };
}

export function serializeAndCompressBackup(bundle: BackupBundle): {
  buffer: Buffer;
  sha256: string;
} {
  const jsonStr = JSON.stringify(bundle);
  const compressed = zlib.gzipSync(Buffer.from(jsonStr, 'utf-8'), { level: 9 });
  const sha256 = crypto.createHash('sha256').update(compressed).digest('hex');
  return { buffer: compressed, sha256 };
}

export function decompressAndValidateBackup(
  compressedBuffer: Buffer,
  expectedSha256?: string,
): BackupBundle {
  if (expectedSha256) {
    const actualSha256 = crypto.createHash('sha256').update(compressedBuffer).digest('hex');
    if (actualSha256.toLowerCase() !== expectedSha256.trim().toLowerCase()) {
      throw new Error(
        `Checksum verification failed: expected ${expectedSha256}, got ${actualSha256}`,
      );
    }
  }

  const decompressed = zlib.gunzipSync(compressedBuffer);
  const bundle = JSON.parse(decompressed.toString('utf-8')) as BackupBundle;

  if (bundle.system !== 'JanaSahayak' || bundle.formatVersion !== '1.0.0') {
    throw new Error('Invalid backup bundle: format version or system mismatch');
  }

  return bundle;
}

export async function restoreDatabaseFromBackup(
  client: Queryable,
  bundle: BackupBundle,
): Promise<RestoreResult> {
  const startTime = Date.now();
  const restoredTables: string[] = [];
  const restoredRows: Record<string, number> = {};

  // Verify bundle
  if (!bundle.data || typeof bundle.data !== 'object') {
    throw new Error('Malformed backup bundle: missing table data');
  }

  await client.query('BEGIN;');
  try {
    // Truncate or delete in reverse dependency order to satisfy foreign keys
    const reverseTables = [...BACKUP_TABLES].reverse();
    for (const table of reverseTables) {
      if (bundle.data[table]) {
        try {
          await client.query(`DELETE FROM ${table};`);
        } catch {
          // Table might not exist yet
        }
      }
    }

    // Insert back in dependency order
    for (const table of BACKUP_TABLES) {
      const rows = bundle.data[table];
      if (!rows || rows.length === 0) {
        restoredRows[table] = 0;
        continue;
      }

      for (const row of rows) {
        const columns = Object.keys(row);
        const values = Object.values(row);
        const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
        const colList = columns.map((c) => `"${c}"`).join(', ');

        const sql = `INSERT INTO ${table} (${colList}) VALUES (${placeholders});`;
        await client.query(sql, values);
      }

      restoredTables.push(table);
      restoredRows[table] = rows.length;
    }

    await client.query('COMMIT;');
  } catch (err) {
    await client.query('ROLLBACK;');
    throw err;
  }

  return {
    success: true,
    restoredTables,
    restoredRows,
    durationMs: Date.now() - startTime,
  };
}
