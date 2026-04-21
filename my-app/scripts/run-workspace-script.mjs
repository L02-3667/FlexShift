import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import path from 'node:path';

function getWorkspaceRoot() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

function runProcess(command, args, cwd) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      cwd,
      stdio: 'inherit',
      shell: process.platform === 'win32',
      env: {
        ...process.env,
        FORCE_COLOR: '0',
      },
    });

    child.on('error', () => {
      resolve(1);
    });
    child.on('close', (code) => {
      resolve(code ?? 1);
    });
  });
}

const [workspace = '.', scriptName, ...extraArgs] = process.argv.slice(2);

if (!scriptName) {
  console.error(
    'Usage: node ./scripts/run-workspace-script.mjs <workspace> <script> [...args]',
  );
  process.exit(1);
}

const rootDir = getWorkspaceRoot();
const cwd = path.resolve(rootDir, workspace);
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const npmArgs = ['run', scriptName];

if (extraArgs.length > 0) {
  npmArgs.push('--', ...extraArgs);
}

const exitCode = await runProcess(npmCommand, npmArgs, cwd);
process.exit(exitCode);
