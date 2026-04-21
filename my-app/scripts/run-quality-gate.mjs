import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const releaseDir = path.join(rootDir, 'reports', 'release');
const logsDir = path.join(releaseDir, 'logs');
const summaryPath = path.join(releaseDir, 'release-gate-summary.md');
const summaryJsonPath = path.join(releaseDir, 'release-gate-summary.json');
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const runBuild = process.argv.includes('--build');
const ciMode = process.argv.includes('--ci');

await mkdir(logsDir, { recursive: true });

const steps = [
  {
    id: 'typecheck-mobile',
    label: 'Mobile typecheck',
    command: npmCommand,
    args: ['run', 'typecheck'],
    category: 'static',
  },
  {
    id: 'typecheck-backend',
    label: 'Backend typecheck',
    command: npmCommand,
    args: ['run', 'typecheck:backend'],
    category: 'static',
  },
  {
    id: 'lint',
    label: 'ESLint',
    command: npmCommand,
    args: ['run', 'lint'],
    category: 'static',
  },
  {
    id: 'prettier-check',
    label: 'Prettier check',
    command: npmCommand,
    args: ['run', 'prettier:check'],
    category: 'static',
  },
  {
    id: 'static-audits',
    label: 'Repo static audits',
    command: npmCommand,
    args: ['run', 'audit:static'],
    category: 'static',
  },
  {
    id: 'mobile-unit',
    label: 'Mobile unit tests',
    command: npmCommand,
    args: ['run', 'test:unit'],
    category: 'tests',
  },
  {
    id: 'mobile-components',
    label: 'Mobile component tests',
    command: npmCommand,
    args: ['run', 'test:components'],
    category: 'tests',
  },
  {
    id: 'mobile-snapshots',
    label: 'Mobile snapshot tests',
    command: npmCommand,
    args: ['run', 'test:snapshots'],
    category: 'tests',
  },
  {
    id: 'mobile-resilience',
    label: 'Mobile resilience tests',
    command: npmCommand,
    args: ['run', 'test:resilience'],
    category: 'tests',
  },
  {
    id: 'backend-tests',
    label: 'Backend test suite',
    command: npmCommand,
    args: ['run', 'test:backend'],
    category: 'tests',
  },
  {
    id: 'mobile-coverage',
    label: 'Mobile coverage',
    command: npmCommand,
    args: ['run', 'test:coverage'],
    category: 'coverage',
  },
  {
    id: 'backend-coverage',
    label: 'Backend coverage',
    command: npmCommand,
    args: ['run', 'test:backend:coverage'],
    category: 'coverage',
  },
  {
    id: 'e2e',
    label: 'Maestro E2E',
    command: npmCommand,
    args: ['run', ciMode ? 'test:e2e' : 'test:e2e'],
    category: 'e2e',
  },
  ...(runBuild
    ? [
        {
          id: 'build-backend',
          label: 'Backend build',
          command: npmCommand,
          args: ['run', 'build:backend'],
          category: 'build',
        },
        {
          id: 'build-mobile-check',
          label: 'Mobile export build check',
          command: npmCommand,
          args: ['run', 'build:mobile:check'],
          category: 'build',
        },
      ]
    : []),
];

function toRelative(filePath) {
  return path.relative(rootDir, filePath);
}

function stringifyCommand(step) {
  return [step.command, ...step.args].join(' ');
}

function extractTestCounts(output) {
  const suiteMatch = output.match(/Test Suites:\s*([^\n\r]+)/);
  const testsMatch = output.match(/Tests:\s*([^\n\r]+)/);

  if (!suiteMatch && !testsMatch) {
    return null;
  }

  return {
    suites: suiteMatch?.[1]?.trim() ?? null,
    tests: testsMatch?.[1]?.trim() ?? null,
  };
}

function extractFailureExcerpt(output) {
  const lines = output.trim().split(/\r?\n/).filter(Boolean);

  if (lines.length === 0) {
    return [];
  }

  return lines.slice(-20);
}

function quoteWindowsArg(value) {
  if (value.length === 0) {
    return '""';
  }

  if (!/[&()[\]{}^=;!'+,`~|<> \t"]/u.test(value)) {
    return value;
  }

  return `"${value.replace(/"/g, '\\"')}"`;
}

function runWindowsCapturedCommand(command, args, logPath, options = {}) {
  return new Promise((resolve) => {
    const child = spawn(
      process.env.ComSpec ?? 'cmd.exe',
      [
        '/d',
        '/s',
        '/c',
        `${[command, ...args].map(quoteWindowsArg).join(' ')} > ${quoteWindowsArg(logPath)} 2>&1`,
      ],
      {
        cwd: rootDir,
        stdio: 'inherit',
        env: {
          ...process.env,
          FORCE_COLOR: '0',
        },
        ...options,
      },
    );

    child.on('error', (error) => {
      resolve({
        code: 1,
        output: '',
        error: error.message,
      });
    });

    child.on('close', async (code) => {
      const output = await readFile(logPath, 'utf8').catch(() => '');
      if (output) {
        process.stdout.write(output);
      }

      resolve({
        code: code ?? 1,
        output,
      });
    });
  });
}

function runCommand(command, args, options = {}) {
  if (process.platform === 'win32') {
    return runWindowsCapturedCommand(
      command,
      args,
      path.join(releaseDir, '.command-output.log'),
      options,
    );
  }

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: false,
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
      ...options,
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

    child.on('error', (error) => {
      resolve({
        code: 1,
        output,
        error: error.message,
      });
    });

    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        output,
      });
    });
  });
}

function runLoggedCommand(command, args, logPath) {
  if (process.platform !== 'win32') {
    return runCommand(command, args);
  }

  return runWindowsCapturedCommand(command, args, logPath);
}

async function runStep(step) {
  const startedAt = new Date();
  const logPath = path.join(logsDir, `${step.id}.log`);
  const result = await runLoggedCommand(step.command, step.args, logPath);
  const finishedAt = new Date();
  if (process.platform !== 'win32') {
    await writeFile(logPath, result.output ?? '');
  }

  return {
    ...step,
    commandLine: stringifyCommand(step),
    status: result.code === 0 ? 'passed' : 'failed',
    exitCode: result.code,
    startedAt: startedAt.toISOString(),
    finishedAt: finishedAt.toISOString(),
    durationMs: finishedAt.getTime() - startedAt.getTime(),
    logPath: toRelative(logPath),
    testCounts: extractTestCounts(result.output ?? ''),
    failureExcerpt:
      result.code === 0 ? [] : extractFailureExcerpt(result.output ?? ''),
    error: result.error,
  };
}

async function safeReadJson(relativePath) {
  try {
    const content = await readFile(path.join(rootDir, relativePath), 'utf8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

async function safeReadText(relativePath) {
  try {
    return await readFile(path.join(rootDir, relativePath), 'utf8');
  } catch {
    return null;
  }
}

function parseJUnit(xmlText) {
  if (!xmlText) {
    return null;
  }

  const rootTag =
    xmlText.match(/<testsuites\b[^>]*>/)?.[0] ??
    xmlText.match(/<testsuite\b[^>]*>/)?.[0];

  if (!rootTag) {
    return null;
  }

  const getAttribute = (attributeName) => {
    const match = rootTag.match(new RegExp(`${attributeName}="(\\d+)"`));
    return match ? Number(match[1]) : 0;
  };

  return {
    tests: getAttribute('tests'),
    failures: getAttribute('failures'),
    errors: getAttribute('errors'),
    skipped: getAttribute('skipped'),
  };
}

async function readCoverageSummary(relativePath) {
  const json = await safeReadJson(relativePath);

  if (!json?.total) {
    return null;
  }

  return {
    lines: json.total.lines?.pct ?? null,
    statements: json.total.statements?.pct ?? null,
    functions: json.total.functions?.pct ?? null,
    branches: json.total.branches?.pct ?? null,
  };
}

function statusLabel(overallStatus) {
  if (overallStatus === 'blocked') {
    return 'blocked';
  }

  return overallStatus === 'passed' ? 'passed' : 'failed';
}

const results = [];
let failedStepId = null;

for (const step of steps) {
  if (failedStepId) {
    results.push({
      ...step,
      commandLine: stringifyCommand(step),
      status: 'not_run',
      exitCode: null,
      startedAt: null,
      finishedAt: null,
      durationMs: 0,
      logPath: null,
      testCounts: null,
      failureExcerpt: [],
    });
    continue;
  }

  const stepResult = await runStep(step);
  results.push(stepResult);

  if (stepResult.exitCode !== 0) {
    failedStepId = step.id;
  }
}

const gitStatusResult = await runCommand('git', ['status', '--short']);
const didRunStep = (stepId) =>
  ['passed', 'failed'].includes(
    results.find((result) => result.id === stepId)?.status ?? 'not_run',
  );
const staticAuditSummary = didRunStep('static-audits')
  ? await safeReadJson('reports/static/static-audits.json')
  : null;
const maestroSummary = didRunStep('e2e')
  ? await safeReadJson('reports/e2e/maestro-status.json')
  : null;
const mobileCoverageSummary = didRunStep('mobile-coverage')
  ? await readCoverageSummary(
      'reports/tests/coverage/mobile/coverage-summary.json',
    )
  : null;
const backendCoverageSummary = didRunStep('backend-coverage')
  ? await readCoverageSummary(
      'reports/tests/coverage/backend/coverage-summary.json',
    )
  : null;
const mobileJUnit = didRunStep('mobile-coverage')
  ? parseJUnit(await safeReadText('reports/tests/junit/mobile/junit.xml'))
  : null;
const backendJUnit = didRunStep('backend-coverage')
  ? parseJUnit(await safeReadText('reports/tests/junit/backend/junit.xml'))
  : null;

const failedSteps = results.filter((result) => result.status === 'failed');
const blockedByE2E =
  failedSteps.some((result) => result.id === 'e2e') &&
  maestroSummary?.status === 'blocked';
const overallStatus = blockedByE2E
  ? 'blocked'
  : failedSteps.length > 0
    ? 'failed'
    : 'passed';

const blockers = [];

if (blockedByE2E) {
  blockers.push({
    id: 'e2e',
    reason: maestroSummary.reason,
  });
}

for (const failedStep of failedSteps) {
  if (failedStep.id === 'e2e' && blockedByE2E) {
    continue;
  }

  blockers.push({
    id: failedStep.id,
    reason:
      failedStep.failureExcerpt[failedStep.failureExcerpt.length - 1] ?? '',
  });
}

const proposedFixes = [];

if (failedSteps.some((step) => step.id === 'prettier-check')) {
  proposedFixes.push(
    'Run `npm exec prettier --write .` and rerun the release gate.',
  );
}

if (blockedByE2E) {
  proposedFixes.push(
    'Install Maestro CLI in the execution environment or rerun the release gate in CI with Maestro available on PATH.',
  );
}

if (failedSteps.some((step) => step.id === 'static-audits')) {
  proposedFixes.push(
    'Review `reports/static/static-audits.md` and fix the failing repo-specific architecture checks.',
  );
}

if (proposedFixes.length === 0 && overallStatus !== 'passed') {
  proposedFixes.push(
    'Inspect the failing step log under `reports/release/logs/` and rerun `npm run verify:release` after the fix.',
  );
}

const summary = {
  status: statusLabel(overallStatus),
  generatedAt: new Date().toISOString(),
  mode: ciMode ? 'ci' : 'local',
  buildIncluded: runBuild,
  nodeVersion: process.version,
  command: `node ${path.relative(rootDir, fileURLToPath(import.meta.url))}${
    process.argv.slice(2).length > 0
      ? ` ${process.argv.slice(2).join(' ')}`
      : ''
  }`,
  changedFiles: gitStatusResult.output
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean),
  steps: results,
  failedSteps: failedSteps.map((step) => ({
    id: step.id,
    label: step.label,
    logPath: step.logPath,
    excerpt: step.failureExcerpt,
  })),
  blockers,
  proposedFixes,
  rerunStatus: 'not_attempted_in_this_report',
  staticAuditSummary,
  e2eSummary: maestroSummary,
  coverageSummary: {
    mobile: mobileCoverageSummary,
    backend: backendCoverageSummary,
  },
  junitSummary: {
    mobile: mobileJUnit,
    backend: backendJUnit,
  },
  resilienceSummary: {
    mobileResilienceStep:
      results.find((step) => step.id === 'mobile-resilience')?.status ??
      'not_run',
    backendConcurrencyIncluded: true,
    pendingBlockedByE2E: blockedByE2E,
  },
  performanceSummary: {
    status: 'not_measured',
    reason:
      'No dedicated automated performance smoke is wired into the release gate yet; resilience and E2E outputs are reported instead.',
  },
};

const markdownLines = [
  '# Release Gate Summary',
  '',
  `- Status: ${summary.status}`,
  `- Generated at: ${summary.generatedAt}`,
  `- Mode: ${summary.mode}`,
  `- Build included: ${summary.buildIncluded ? 'yes' : 'no'}`,
  `- Node runtime: ${summary.nodeVersion}`,
  `- Command: ${summary.command}`,
  '',
  '## Step Results',
  '',
  ...results.map(
    (result) =>
      `- ${result.label}: ${result.status} (${result.commandLine})${
        result.logPath ? ` -> ${result.logPath}` : ''
      }`,
  ),
  '',
  '## Coverage Summary',
  '',
  `- Mobile: ${
    mobileCoverageSummary
      ? `lines ${mobileCoverageSummary.lines}%, statements ${mobileCoverageSummary.statements}%, functions ${mobileCoverageSummary.functions}%, branches ${mobileCoverageSummary.branches}%`
      : 'not available'
  }`,
  `- Backend: ${
    backendCoverageSummary
      ? `lines ${backendCoverageSummary.lines}%, statements ${backendCoverageSummary.statements}%, functions ${backendCoverageSummary.functions}%, branches ${backendCoverageSummary.branches}%`
      : 'not available'
  }`,
  '',
  '## Test Counts',
  '',
  `- Mobile JUnit: ${
    mobileJUnit
      ? `${mobileJUnit.tests} tests, ${mobileJUnit.failures} failures, ${mobileJUnit.errors} errors, ${mobileJUnit.skipped} skipped`
      : 'not available'
  }`,
  `- Backend JUnit: ${
    backendJUnit
      ? `${backendJUnit.tests} tests, ${backendJUnit.failures} failures, ${backendJUnit.errors} errors, ${backendJUnit.skipped} skipped`
      : 'not available'
  }`,
  '',
  '## Blockers',
  '',
  ...(blockers.length > 0
    ? blockers.map((blocker) => `- ${blocker.id}: ${blocker.reason}`)
    : ['- None']),
  '',
  '## Proposed Fixes',
  '',
  ...(proposedFixes.length > 0
    ? proposedFixes.map((fix) => `- ${fix}`)
    : ['- No fixes required.']),
  '',
  '## Git Status',
  '',
  ...(summary.changedFiles.length > 0
    ? summary.changedFiles.map((line) => `- ${line}`)
    : ['- Working tree clean']),
  '',
];

if (failedSteps.length > 0) {
  markdownLines.push('## Failure Excerpts');
  markdownLines.push('');

  for (const failedStep of failedSteps) {
    markdownLines.push(`### ${failedStep.label}`);
    markdownLines.push('');
    markdownLines.push('```text');
    markdownLines.push(
      failedStep.failureExcerpt.length > 0
        ? failedStep.failureExcerpt.join('\n')
        : '(no excerpt captured)',
    );
    markdownLines.push('```');
    markdownLines.push('');
  }
}

await writeFile(summaryJsonPath, JSON.stringify(summary, null, 2));
await writeFile(summaryPath, markdownLines.join('\n'));

process.exit(overallStatus === 'passed' ? 0 : 1);
