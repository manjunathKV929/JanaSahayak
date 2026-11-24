import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import {
  createDatabaseBackup,
  createDatabasePool,
  serializeAndCompressBackup,
} from '../packages/db/src/index.js';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const backupsDir = path.join(rootDir, 'backups');

async function runBackup() {
  const databaseUrl =
    process.env.DATABASE_URL ||
    'postgresql://janasahayak:change_me_local_dev_only@127.0.0.1:5432/janasahayak_dev';
  const ssl = process.env.DATABASE_SSL === 'true';

  process.stdout.write(`Initiating JanaSahayak database backup snapshot...\n`);
  process.stdout.write(`Database host target: ${databaseUrl.replace(/:[^:@]+@/, ':****@')}\n`);

  if (!fs.existsSync(backupsDir)) {
    fs.mkdirSync(backupsDir, { recursive: true });
  }

  const pool = createDatabasePool({
    connectionString: databaseUrl,
    ssl,
    maxConnections: 2,
    connectionTimeoutMs: 10000,
  });

  try {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFileName = `janasahayak-backup-${timestamp}.json.gz`;
    const backupFilePath = path.join(backupsDir, backupFileName);
    const checksumFilePath = `${backupFilePath}.sha256`;

    const bundle = await createDatabaseBackup(pool);
    const { buffer, sha256 } = serializeAndCompressBackup(bundle);

    fs.writeFileSync(backupFilePath, buffer);
    fs.writeFileSync(checksumFilePath, `${sha256}  ${backupFileName}\n`, 'utf-8');

    const totalRows = Object.values(bundle.tableCounts).reduce((a, b) => a + b, 0);

    process.stdout.write(`\nBackup successfully completed!\n`);
    process.stdout.write(`File: ${backupFilePath} (${(buffer.length / 1024).toFixed(2)} KB)\n`);
    process.stdout.write(`SHA-256 Checksum: ${sha256}\n`);
    process.stdout.write(`Tables backed up: ${Object.keys(bundle.tableCounts).length}\n`);
    process.stdout.write(`Total records: ${totalRows}\n`);
  } finally {
    await pool.end();
  }
}

runBackup().catch((err) => {
  process.stderr.write(`Backup failed: ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(1);
});
