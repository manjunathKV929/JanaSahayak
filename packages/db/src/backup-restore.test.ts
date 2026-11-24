import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  createDatabaseBackup,
  decompressAndValidateBackup,
  restoreDatabaseFromBackup,
  serializeAndCompressBackup,
  type BackupBundle,
} from './backup.js';
import type { Queryable } from './client.js';

describe('Database Backup & Restore Drill', () => {
  it('creates, compresses, and validates backup bundles with checksum verification', async () => {
    const mockDb: Queryable = {
      query: async (sql: string) => {
        if (sql.includes('categories')) {
          return { rows: [{ id: 'cat-1', name: 'Agriculture', slug: 'agriculture' }] };
        }
        if (sql.includes('services')) {
          return { rows: [{ id: 'srv-1', title: 'Rythu Bharosa', slug: 'rythu-bharosa' }] };
        }
        return { rows: [] };
      },
    };

    const bundle = await createDatabaseBackup(mockDb);
    assert.equal(bundle.system, 'JanaSahayak');
    assert.equal(bundle.formatVersion, '1.0.0');
    assert.equal(bundle.tableCounts['categories'], 1);
    assert.equal(bundle.tableCounts['services'], 1);
    assert.equal(bundle.data['categories']?.[0]?.['name'], 'Agriculture');

    const { buffer, sha256 } = serializeAndCompressBackup(bundle);
    assert.ok(buffer.length > 0);
    assert.equal(typeof sha256, 'string');
    assert.equal(sha256.length, 64);

    // Validate with correct checksum
    const restored = decompressAndValidateBackup(buffer, sha256);
    assert.deepEqual(restored.tableCounts, bundle.tableCounts);
    assert.equal(restored.data['categories']?.[0]?.['slug'], 'agriculture');

    // Tamper detection: should throw on checksum mismatch
    assert.throws(
      () => {
        decompressAndValidateBackup(
          buffer,
          '0000000000000000000000000000000000000000000000000000000000000000',
        );
      },
      {
        message: /Checksum verification failed/,
      },
    );
  });

  it('restores tables in transactional order and verifies row count integrity', async () => {
    const executedQueries: Array<{ sql: string; values?: unknown[] }> = [];

    const mockDb: Queryable = {
      query: async (sql: string, values?: readonly unknown[]) => {
        executedQueries.push({ sql, values: values ? [...values] : undefined });
        return { rows: [] };
      },
    };

    const bundle: BackupBundle = {
      formatVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      system: 'JanaSahayak',
      tableCounts: {
        categories: 1,
        services: 1,
      },
      data: {
        categories: [{ id: 'cat-1', name: 'Social Welfare' }],
        services: [{ id: 'srv-1', title: 'Gruha Lakshmi' }],
      },
    };

    const result = await restoreDatabaseFromBackup(mockDb, bundle);

    assert.equal(result.success, true);
    assert.equal(result.restoredRows['categories'], 1);
    assert.equal(result.restoredRows['services'], 1);

    // Verify transaction lifecycle: BEGIN -> DELETEs -> INSERTs -> COMMIT
    assert.equal(executedQueries[0]?.sql, 'BEGIN;');
    assert.equal(executedQueries[executedQueries.length - 1]?.sql, 'COMMIT;');

    const insertCategory = executedQueries.find((q) => q.sql.includes('INSERT INTO categories'));
    assert.ok(insertCategory, 'Must execute insert for categories');
    assert.deepEqual(insertCategory?.values, ['cat-1', 'Social Welfare']);
  });

  it('rolls back database transaction if any table insert fails', async () => {
    const executedQueries: string[] = [];

    const failingDb: Queryable = {
      query: async (sql: string) => {
        executedQueries.push(sql);
        if (sql.includes('INSERT INTO services')) {
          throw new Error('Foreign key violation simulated');
        }
        return { rows: [] };
      },
    };

    const bundle: BackupBundle = {
      formatVersion: '1.0.0',
      createdAt: new Date().toISOString(),
      system: 'JanaSahayak',
      tableCounts: {
        categories: 1,
        services: 1,
      },
      data: {
        categories: [{ id: 'cat-1', name: 'Social Welfare' }],
        services: [{ id: 'srv-1', title: 'Gruha Lakshmi' }],
      },
    };

    await assert.rejects(
      async () => {
        await restoreDatabaseFromBackup(failingDb, bundle);
      },
      {
        message: /Foreign key violation simulated/,
      },
    );

    assert.ok(executedQueries.includes('BEGIN;'));
    assert.ok(executedQueries.includes('ROLLBACK;'));
    assert.ok(!executedQueries.includes('COMMIT;'));
  });
});
