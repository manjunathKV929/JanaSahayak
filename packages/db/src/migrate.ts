import { loadDbEnv } from '@janasahayak/config';
import { createDatabasePool } from './client.js';
import { runMigrations } from './migrator.js';

async function main(): Promise<void> {
  const env = loadDbEnv();
  const pool = createDatabasePool({
    connectionString: env.DATABASE_URL,
    ssl: env.DATABASE_SSL,
    maxConnections: env.DATABASE_POOL_MAX,
  });

  try {
    const result = await runMigrations(pool);
    process.stdout.write(
      `Migrations complete. Applied: ${result.applied.length}, Skipped: ${result.skipped.length}\n`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : 'Unknown migration error';
  process.stderr.write(`Migration failed: ${message}\n`);
  process.exitCode = 1;
});
