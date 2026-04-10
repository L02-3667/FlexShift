import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const reportsDir = path.join(rootDir, 'reports');
const logsDir = path.join(reportsDir, 'logs');
const summaryPath = path.join(reportsDir, 'quality-summary.md');
const summaryJsonPath = path.join(reportsDir, 'quality-summary.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const runBuild = process.argv.includes('--build');
const ciMode = process.argv.includes('--ci');

await mkdir(logsDir, { recursive: true });

const steps = [
  { name: 'typecheck', command: npmCommand, args: ['run', 'typecheck'] },
  {
    name: 'backend-typecheck',
    command: npmCommand,
    args: ['run', 'typecheck:backend'],
  },
  { name: 'lint', command: npmCommand, args: ['run', 'lint'] },
  {
    name: 'prettier-check',
    command: npmCommand,
    args: ['run', 'prettier:check'],
  },
  { name: 'mobile-unit', command: npmCommand, args: ['run', 'test:unit'] },
  {
    name: 'mobile-components',
    command: npmCommand,
    args: ['run', 'test:components'],
  },
  {
    name: 'mobile-snapshots',
    command: npmCommand,
    args: ['run', 'test:snapshots'],
  },
  { name: 'backend-tests', command: npmCommand, args: ['run', 'test:backend'] },
  {
    name: 'backend-integration',
    command: npmCommand,
    args: ['run', 'test:backend:integration'],
  },
  {
    name: ciMode ? 'e2e' : 'e2e-ready',
    command: npmCommand,
    args: ['run', ciMode ? 'test:e2e' : 'test:e2e:ready'],
  },
  ...(runBuild
    ? [
        {
          name: 'build-backend',
          command: npmCommand,
          args: ['run', 'build:backend'],
        },
        {
          name: 'build-mobile-check',
          command: npmCommand,
          args: ['run', 'build:mobile:check'],
        },
      ]
    : []),
];

function runStep(step) {
  return new Promise((resolve) => {
    const child = spawn(step.command, step.args, {
      cwd: rootDir,
      shell: false,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    let output = '';
    child.stdout.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on('close', async (code) => {
      const status = code === 0 ? 'passed' : 'failed';
      const logPath = path.join(logsDir, `${step.name}.log`);
      await writeFile(logPath, output);
      resolve({
        ...step,
        code: code ?? 1,
        status,
        logPath: path.relative(rootDir, logPath),
      });
    });
  });
}

const results = [];
let failed = false;

for (const step of steps) {
  if (failed) {
    break;
  }

  const result = await runStep(step);
  results.push(result);

  if (result.code !== 0) {
    failed = true;
  }
}

const summary = {
  status: failed ? 'failed' : 'passed',
  mode: ciMode ? 'ci' : 'local',
  buildIncluded: runBuild,
  generatedAt: new Date().toISOString(),
  steps: results,
};

await writeFile(summaryJsonPath, JSON.stringify(summary, null, 2));
await writeFile(
  summaryPath,
  [
    '# Quality Summary',
    '',
    `- Status: ${summary.status}`,
    `- Mode: ${summary.mode}`,
    `- Build included: ${summary.buildIncluded ? 'yes' : 'no'}`,
    `- Generated at: ${summary.generatedAt}`,
    '',
    ...results.map(
      (result) => `- ${result.name}: ${result.status} (${result.logPath})`,
    ),
  ].join('\n'),
);

process.exit(failed ? 1 : 0);
