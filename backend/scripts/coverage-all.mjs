#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, readFileSync, rmSync } from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const libCoverage = require('istanbul-lib-coverage');

const THRESHOLDS = { statements: 90, branches: 75, functions: 85, lines: 90 };
const OUT = path.resolve('coverage');
const JEST = [
  '--experimental-vm-modules',
  './node_modules/jest/bin/jest.js',
  '--coverage',
  '--coverageReporters=json',
  '--collectCoverageFrom=src/**/*.ts',
  '--collectCoverageFrom=!src/**/*.spec.ts',
  '--collectCoverageFrom=!src/main.ts',
  '--collectCoverageFrom=!src/generated/**',
];

function run(label, extraArgs, dir) {
  console.log(`\n▶ ${label}`);
  const result = spawnSync(
    'node',
    [...JEST, `--coverageDirectory=${dir}`, ...extraArgs],
    {
      stdio: ['ignore', 'pipe', 'pipe'],
      encoding: 'utf8',
    },
  );
  const summary = (result.stdout + result.stderr)
    .split('\n')
    .filter((l) => /^Tests:|^Test Suites:/.test(l));
  summary.forEach((l) => console.log('  ' + l));
  if (result.status !== 0) {
    console.error(result.stdout.slice(-3000), result.stderr.slice(-3000));
    console.error(`✖ ${label} falhou`);
    process.exit(result.status ?? 1);
  }
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });

run('Testes unitários', [], path.join(OUT, 'unit'));
run(
  'Testes E2E (precisam do PostgreSQL em DATABASE_URL)',
  [
    '--config',
    './test/jest-e2e.json',
    '--rootDir',
    '.',
    '--testRegex',
    'test/.*\\.e2e-spec\\.ts$',
  ],
  path.join(OUT, 'e2e'),
);

const map = libCoverage.createCoverageMap({});
for (const dir of ['unit', 'e2e']) {
  map.merge(
    JSON.parse(
      readFileSync(path.join(OUT, dir, 'coverage-final.json'), 'utf8'),
    ),
  );
}

const totals = {
  statements: [0, 0],
  branches: [0, 0],
  functions: [0, 0],
  lines: [0, 0],
};
const files = [];
for (const file of map.files()) {
  const fileCoverage = map.fileCoverageFor(file);
  const summary = fileCoverage.toSummary();
  for (const key of Object.keys(totals)) {
    totals[key][0] += summary[key].covered;
    totals[key][1] += summary[key].total;
  }
  files.push({
    file: path.relative(process.cwd(), file),
    lines: summary.lines.pct,
    uncovered: fileCoverage.getUncoveredLines(),
  });
}

console.log('\nArquivos abaixo de 100% de linhas:');
files
  .filter((f) => f.lines < 100)
  .sort((a, b) => a.lines - b.lines)
  .forEach((f) =>
    console.log(
      `  ${String(f.lines).padStart(5)}%  ${f.file}  (linhas ${f.uncovered.join(', ')})`,
    ),
  );

console.log('\nCobertura combinada (unitários + E2E):');
let failed = false;
for (const [key, [covered, total]] of Object.entries(totals)) {
  const pct = total === 0 ? 100 : (100 * covered) / total;
  const ok = pct >= THRESHOLDS[key];
  failed ||= !ok;
  console.log(
    `  ${ok ? '✔' : '✖'} ${key.padEnd(11)} ${pct.toFixed(1).padStart(5)}%  (mínimo ${THRESHOLDS[key]}%)`,
  );
}

process.exit(failed ? 1 : 0);
