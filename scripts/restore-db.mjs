import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import {
  createDatabasePool,
  decompressAndValidateBackup,
  restoreDatabaseFromBackup,
} from '../packages/db/src/index.js';

async function runRestore() {
  const filePathArg = process.argv[2];
  if (!filePathArg) {
    process.stderr.write('Usage: node scripts/restore-db.mjs <path-to-backup.json.gz>\n');
    process.exit(1);
  }

  const backupFilePath = path.resolve(filePathArg);
  if (!fs.existsSync(backupFilePath)) {
    process.stderr.write(`Error: Backup file not found: ${backupFilePath}\n`);
    process.exit(1);
  }

  const checksumFilePath = `${backupFilePath}.sha256`;
  let expectedSha256 = undefined;
  if (fs.existsSync(checksumFilePath)) {
    const content = fs.readFileSync(checksumFilePath, 'utf-8').trim();
    expectedSha256 = content.split(/\s+/)[0];
  }

  process.stdout.write(`Reading and validating backup file: ${backupFilePath}\n`);
  const compressedBuffer = fs.readFileSync(backupFilePath);

  const bundle = decompressAndValidateBackup(compressedBuffer, expectedSha256);
  process.stdout.write(`Backup validated! Checksum verified. Created at: ${bundle.createdAt}\n`);

  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://janasahayak:change_me_local_dev_only@127.0.0.1:5432/janasahayak_dev';
  const ssl = process.env.DATABASE_SSL === 'true';

  process.stdout.write(`Restoring to database: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  const pool = createDatabasePool({
    connectionString: databaseUrl,
    ssl,
    maxConnections: 2,
    connectionTimeoutMs: 10000,
  });

  try {
    const result = await restoreDatabaseFromBackup(pool, bundle);
    process.stdout.write(`\nRestore drill successful in ${result.durationMs}ms!\n`);
    process.stdout.write(`Tables restored: ${result.restoredTables.join(', ')}\n`);
    const totalRestored = Object.values(result.restoredRows).reduce((a, b) => a + b, 0);
    process.stdout.write(`Total records restored: ${totalRestored}\n`);
  } finally {
    await pool.end();
  }
}

runRestore().catch((err) => {
  process.stderr.write(`Restore failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
