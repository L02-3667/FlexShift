const REQUIRED_ENV_KEYS = [
  'DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export interface ValidatedEnv {
  APP_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;
  DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
  CORS_ALLOWED_ORIGINS: string[];
  CORS_ALLOW_CREDENTIALS: boolean;
  PUBLIC_API_BASE_URL?: string;
  API_DOCS_ENABLED: boolean;
  API_DOCS_PATH: string;
  SYNC_BATCH_LIMIT: number;
  SYNC_DEFAULT_STALE_MS: number;
}

function requireNumber(
  rawValue: string | undefined,
  fallback: number,
  key: string,
) {
  const resolved = rawValue ?? `${fallback}`;
  const parsed = Number(resolved);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`Environment variable ${key} must be a positive number.`);
  }

  return parsed;
}

function parseBoolean(rawValue: string | undefined, fallback: boolean) {
  if (rawValue === undefined) {
    return fallback;
  }

  const normalized = rawValue.trim().toLowerCase();

  if (['1', 'true', 'yes', 'on'].includes(normalized)) {
    return true;
  }

  if (['0', 'false', 'no', 'off'].includes(normalized)) {
    return false;
  }

  return fallback;
}

function parseStringList(rawValue: string | undefined) {
  return (rawValue ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

function normalizeDocsPath(rawValue: string | undefined) {
  const resolved = (rawValue ?? 'docs').trim().replace(/^\/+|\/+$/g, '');
  return resolved || 'docs';
}

export function validateEnv(config: NodeJS.ProcessEnv): ValidatedEnv {
  const missingKeys = REQUIRED_ENV_KEYS.filter((key) => !config[key]);

  if (missingKeys.length > 0) {
    throw new Error(
      `Missing required backend environment variables: ${missingKeys.join(', ')}.`,
    );
  }

  return {
    APP_ENV:
      config.APP_ENV === 'production' ||
      config.APP_ENV === 'staging' ||
      config.APP_ENV === 'test'
        ? config.APP_ENV
        : 'development',
    PORT: requireNumber(config.PORT, 3000, 'PORT'),
    DATABASE_URL: config.DATABASE_URL!,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET!,
    CORS_ALLOWED_ORIGINS: parseStringList(config.CORS_ALLOWED_ORIGINS),
    CORS_ALLOW_CREDENTIALS: parseBoolean(
      config.CORS_ALLOW_CREDENTIALS,
      false,
    ),
    PUBLIC_API_BASE_URL: config.PUBLIC_API_BASE_URL?.trim() || undefined,
    API_DOCS_ENABLED: parseBoolean(config.API_DOCS_ENABLED, true),
    API_DOCS_PATH: normalizeDocsPath(config.API_DOCS_PATH),
    SYNC_BATCH_LIMIT: requireNumber(
      config.SYNC_BATCH_LIMIT,
      250,
      'SYNC_BATCH_LIMIT',
    ),
    SYNC_DEFAULT_STALE_MS: requireNumber(
      config.SYNC_DEFAULT_STALE_MS,
      5 * 60 * 1000,
      'SYNC_DEFAULT_STALE_MS',
    ),
  };
}
