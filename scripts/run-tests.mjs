import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const searchRoots = ['packages', 'services', 'apps', 'tests'];
const ignoredDirs = new Set(['node_modules', 'dist', 'build', '.next', 'coverage']);

function collectTestFiles(dir, acc) {
  if (!fs.existsSync(dir)) return;
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (!ignoredDirs.has(entry.name)) {
        collectTestFiles(path.join(dir, entry.name), acc);
      }
      continue;
    }
    if (entry.isFile() && (entry.name.endsWith('.test.ts') || entry.name.endsWith('.test.tsx'))) {
      acc.push(path.join(dir, entry.name));
    }
  }
}

const testFiles = [];
for (const segment of searchRoots) {
  collectTestFiles(path.join(rootDir, segment), testFiles);
}
testFiles.sort((a, b) => a.localeCompare(b));

if (testFiles.length === 0) {
  process.stderr.write('No test files found.\n');
  process.exit(1);
}

const withCoverage = process.argv.includes('--coverage');
const watchMode = process.argv.includes('--watch');

const nodeArgs = ['--import', 'tsx', '--test'];
if (withCoverage) {
  nodeArgs.push('--experimental-test-coverage');
}
if (watchMode) {
  nodeArgs.push('--watch');
}
nodeArgs.push(...testFiles);

const result = spawnSync(process.execPath, nodeArgs, {
  cwd: rootDir,
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'test',
  },
});

if (result.error) {
  process.stderr.write(`Test runner error: ${result.error.message}\n`);
  process.exit(1);
}

process.exit(result.status ?? 1);
