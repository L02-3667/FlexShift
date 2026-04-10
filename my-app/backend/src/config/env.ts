const REQUIRED_ENV_KEYS = [
  'POSTGRES_HOST',
  'POSTGRES_PORT',
  'POSTGRES_DB',
  'POSTGRES_SHADOW_DB',
  'POSTGRES_USER',
  'POSTGRES_PASSWORD',
  'DATABASE_URL',
  'DIRECT_URL',
  'SHADOW_DATABASE_URL',
  'JWT_ACCESS_SECRET',
  'JWT_REFRESH_SECRET',
] as const;

export interface ValidatedEnv {
  APP_ENV: 'development' | 'staging' | 'production' | 'test';
  PORT: number;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  POSTGRES_DB: string;
  POSTGRES_SHADOW_DB: string;
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  DATABASE_URL: string;
  DIRECT_URL: string;
  SHADOW_DATABASE_URL: string;
  JWT_ACCESS_SECRET: string;
  JWT_REFRESH_SECRET: string;
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
    POSTGRES_HOST: config.POSTGRES_HOST!,
    POSTGRES_PORT: requireNumber(config.POSTGRES_PORT, 5432, 'POSTGRES_PORT'),
    POSTGRES_DB: config.POSTGRES_DB!,
    POSTGRES_SHADOW_DB: config.POSTGRES_SHADOW_DB!,
    POSTGRES_USER: config.POSTGRES_USER!,
    POSTGRES_PASSWORD: config.POSTGRES_PASSWORD!,
    DATABASE_URL: config.DATABASE_URL!,
    DIRECT_URL: config.DIRECT_URL!,
    SHADOW_DATABASE_URL: config.SHADOW_DATABASE_URL!,
    JWT_ACCESS_SECRET: config.JWT_ACCESS_SECRET!,
    JWT_REFRESH_SECRET: config.JWT_REFRESH_SECRET!,
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
