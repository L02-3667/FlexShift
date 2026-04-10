import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const reportsDir = path.join(rootDir, 'reports', 'e2e');
const reportPath = path.join(reportsDir, 'maestro-status.json');
const summaryPath = path.join(reportsDir, 'maestro-summary.md');
const runMode = process.argv.includes('--run');

await mkdir(reportsDir, { recursive: true });

const requiredFiles = [
  path.join(rootDir, 'maestro', 'config.yaml'),
  path.join(rootDir, 'maestro', 'login-and-claim-open-shift.yaml'),
  path.join(rootDir, 'maestro', 'manager-review-request.yaml'),
  path.join(rootDir, 'maestro', 'offline-queue-smoke.yaml'),
];

const missingFiles = [];
for (const filePath of requiredFiles) {
  try {
    await access(filePath);
  } catch {
    missingFiles.push(path.relative(rootDir, filePath));
  }
}

function runCommand(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });

    let output = '';
    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
    });
    child.on('close', (code) => {
      resolve({
        code: code ?? 1,
        output,
      });
    });
  });
}

async function writeReports(status) {
  await writeFile(reportPath, JSON.stringify(status, null, 2));
  await writeFile(
    summaryPath,
    [
      '# Maestro status',
      '',
      `- Mode: ${runMode ? 'run' : 'ready-check'}`,
      `- Status: ${status.status}`,
      `- Reason: ${status.reason}`,
      ...(status.output ? ['', '```text', status.output.trim(), '```'] : []),
    ].join('\n'),
  );
}

if (missingFiles.length > 0) {
  const status = {
    status: 'blocked',
    reason: `Missing Maestro files: ${missingFiles.join(', ')}`,
  };
  await writeReports(status);
  process.exit(runMode ? 1 : 0);
}

const versionResult = await runCommand('maestro', ['--version']);

if (versionResult.code !== 0) {
  const status = {
    status: runMode ? 'blocked' : 'ready',
    reason: runMode
      ? 'Maestro CLI is not installed or not on PATH.'
      : 'Flows are ready, but Maestro CLI is not installed in this environment.',
    output: versionResult.output,
  };
  await writeReports(status);
  process.exit(runMode ? 1 : 0);
}

if (!runMode) {
  await writeReports({
    status: 'ready',
    reason: 'Maestro flows are present and the CLI is available.',
    output: versionResult.output,
  });
  process.exit(0);
}

const testResult = await runCommand('maestro', ['test', 'maestro']);
const status = {
  status: testResult.code === 0 ? 'passed' : 'failed',
  reason:
    testResult.code === 0
      ? 'Maestro flows completed.'
      : 'Maestro flows reported failures.',
  output: testResult.output,
};

await writeReports(status);
process.exit(testResult.code === 0 ? 0 : 1);
