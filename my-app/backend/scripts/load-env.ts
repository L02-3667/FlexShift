import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';

export const PROJECT_ENV_FILE_PRIORITY = [
  '.env.local',
  '.env.development',
  '.env',
] as const;

function readEnvFile(fileName: string) {
  const filePath = resolve(process.cwd(), fileName);

  if (!existsSync(filePath)) {
    return null;
  }

  return readFileSync(filePath, 'utf8');
}

function loadEnvFile(fileName: string) {
  const content = readEnvFile(fileName);

  if (!content) {
    return;
  }

  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }

    const separatorIndex = trimmed.indexOf('=');

    if (separatorIndex <= 0) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const rawValue = trimmed.slice(separatorIndex + 1).trim();
    const value = rawValue.replace(/^['"]|['"]$/g, '');

    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

export function findProjectEnvValue(key: string) {
  for (const fileName of PROJECT_ENV_FILE_PRIORITY) {
    const content = readEnvFile(fileName);

    if (!content) {
      continue;
    }

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }

      const separatorIndex = trimmed.indexOf('=');

      if (separatorIndex <= 0) {
        continue;
      }

      const currentKey = trimmed.slice(0, separatorIndex).trim();

      if (currentKey !== key) {
        continue;
      }

      const rawValue = trimmed.slice(separatorIndex + 1).trim();
      return {
        fileName,
        value: rawValue.replace(/^['"]|['"]$/g, ''),
      };
    }
  }

  return null;
}

export function loadProjectEnv() {
  for (const fileName of PROJECT_ENV_FILE_PRIORITY) {
    loadEnvFile(fileName);
  }
}
