import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const rootDir = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
);
const reportsDir = path.join(rootDir, 'reports', 'e2e');
const statusPath = path.join(reportsDir, 'maestro-status.json');
const summaryPath = path.join(reportsDir, 'maestro-summary.md');
const outputLogPath = path.join(reportsDir, 'maestro-output.log');
const runMode = process.argv.includes('--run');
const maestroNativeAppId = 'com.lehoangluan1.flexshiftmobile';

await mkdir(reportsDir, { recursive: true });

const requiredFiles = [
  path.join(rootDir, 'maestro', 'config.yaml'),
  path.join(rootDir, 'maestro', 'app-launch-and-login-validation.yaml'),
  path.join(rootDir, 'maestro', 'employee-navigation-and-logout.yaml'),
  path.join(rootDir, 'maestro', 'employee-create-leave-request.yaml'),
  path.join(rootDir, 'maestro', 'login-and-claim-open-shift.yaml'),
  path.join(rootDir, 'maestro', 'manager-create-open-shift.yaml'),
  path.join(rootDir, 'maestro', 'manager-review-request.yaml'),
  path.join(rootDir, 'maestro', 'offline-queue-smoke.yaml'),
];

function toRelative(filePath) {
  return path.relative(rootDir, filePath);
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

async function collectMissingFiles() {
  const missingFiles = [];

  for (const filePath of requiredFiles) {
    try {
      await access(filePath);
    } catch {
      missingFiles.push(toRelative(filePath));
    }
  }

  return missingFiles;
}

function runCommand(command, args) {
  if (process.platform === 'win32') {
    return new Promise((resolve) => {
      const child = spawn(
        process.env.ComSpec ?? 'cmd.exe',
        [
          '/d',
          '/s',
          '/c',
          `${[command, ...args].map(quoteWindowsArg).join(' ')} > ${quoteWindowsArg(outputLogPath)} 2>&1`,
        ],
        {
          cwd: rootDir,
          stdio: 'inherit',
          env: {
            ...process.env,
            FORCE_COLOR: '0',
          },
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
        const output = await readFile(outputLogPath, 'utf8').catch(() => '');
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

  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd: rootDir,
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    let output = '';

    child.stdout.on('data', (chunk) => {
      output += chunk.toString();
    });

    child.stderr.on('data', (chunk) => {
      output += chunk.toString();
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

function buildMarkdown(status) {
  return [
    '# Maestro Status',
    '',
    `- Mode: ${status.mode}`,
    `- Status: ${status.status}`,
    `- Reason: ${status.reason}`,
    `- Generated at: ${status.generatedAt}`,
    `- CLI available: ${status.cliAvailable ? 'yes' : 'no'}`,
    `- Flow files: ${status.flowFiles.length}`,
    ...(status.missingFiles.length > 0
      ? [`- Missing files: ${status.missingFiles.join(', ')}`]
      : []),
    `- Output log: ${path.relative(rootDir, outputLogPath)}`,
    ...(status.error ? [`- Spawn error: ${status.error}`] : []),
    ...(status.output
      ? ['', '```text', status.output.trim() || '(no output)', '```']
      : []),
    '',
  ].join('\n');
}

function deriveRunFailureReason(output = '') {
  if (
    output.includes(`Package ${maestroNativeAppId} is not installed`) ||
    output.includes(`Unable to launch app ${maestroNativeAppId}`)
  ) {
    return `Maestro could not launch ${maestroNativeAppId} because that app package is not installed on the connected device.`;
  }

  return 'Maestro flows failed or were interrupted.';
}

async function persist(status) {
  await writeFile(statusPath, JSON.stringify(status, null, 2));
  await writeFile(outputLogPath, status.output ?? '');
  await writeFile(summaryPath, buildMarkdown(status));
}

const missingFiles = await collectMissingFiles();

if (missingFiles.length > 0) {
  const status = {
    mode: runMode ? 'run' : 'ready-check',
    status: runMode ? 'blocked' : 'ready',
    reason: `Missing Maestro flow files: ${missingFiles.join(', ')}`,
    generatedAt: new Date().toISOString(),
    cliAvailable: false,
    flowFiles: requiredFiles.map((filePath) => toRelative(filePath)),
    missingFiles,
    output: '',
  };

  await persist(status);
  process.exit(runMode ? 1 : 0);
}

const versionResult = await runCommand('maestro', ['--version']);
const cliAvailable = versionResult.code === 0;

if (!cliAvailable) {
  const status = {
    mode: runMode ? 'run' : 'ready-check',
    status: runMode ? 'blocked' : 'ready',
    reason: runMode
      ? 'Maestro CLI is not installed or not available on PATH.'
      : 'Maestro flows are present, but the CLI is unavailable in this environment.',
    generatedAt: new Date().toISOString(),
    cliAvailable: false,
    flowFiles: requiredFiles.map((filePath) => toRelative(filePath)),
    missingFiles: [],
    output: versionResult.output,
    error: versionResult.error,
  };

  await persist(status);
  process.exit(runMode ? 1 : 0);
}

if (!runMode) {
  const status = {
    mode: 'ready-check',
    status: 'ready',
    reason: 'Maestro flows and CLI are both available.',
    generatedAt: new Date().toISOString(),
    cliAvailable: true,
    flowFiles: requiredFiles.map((filePath) => toRelative(filePath)),
    missingFiles: [],
    output: versionResult.output,
  };

  await persist(status);
  process.exit(0);
}

const testResult = await runCommand('maestro', ['test', 'maestro']);
const status = {
  mode: 'run',
  status: testResult.code === 0 ? 'passed' : 'failed',
  reason:
    testResult.code === 0
      ? 'Maestro flows completed successfully.'
      : deriveRunFailureReason(testResult.output),
  generatedAt: new Date().toISOString(),
  cliAvailable: true,
  flowFiles: requiredFiles.map((filePath) => toRelative(filePath)),
  missingFiles: [],
  output: testResult.output,
  error: testResult.error,
};

await persist(status);
process.exit(testResult.code === 0 ? 0 : 1);
