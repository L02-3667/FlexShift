const LOOPBACK_HOSTS = new Set(['127.0.0.1', 'localhost', '::1']);

export interface DatabaseUrlSummary {
  isPresent: boolean;
  isValid: boolean;
  redactedUrl: string | null;
  host: string | null;
  port: number | null;
  database: string | null;
  schema: string | null;
  sslmode: string | null;
  isLoopback: boolean;
}

function redactCredentials(url: URL) {
  if (url.username) {
    url.username = '***';
  }

  if (url.password) {
    url.password = '***';
  }

  return url.toString();
}

export function summarizeDatabaseUrl(
  databaseUrl: string | undefined,
): DatabaseUrlSummary {
  if (!databaseUrl) {
    return {
      isPresent: false,
      isValid: false,
      redactedUrl: null,
      host: null,
      port: null,
      database: null,
      schema: null,
      sslmode: null,
      isLoopback: false,
    };
  }

  try {
    const url = new URL(databaseUrl);
    const database = decodeURIComponent(url.pathname.replace(/^\/+/, '')) || null;

    return {
      isPresent: true,
      isValid: true,
      redactedUrl: redactCredentials(new URL(databaseUrl)),
      host: url.hostname || null,
      port: url.port ? Number(url.port) : null,
      database,
      schema: url.searchParams.get('schema'),
      sslmode: url.searchParams.get('sslmode'),
      isLoopback: LOOPBACK_HOSTS.has(url.hostname),
    };
  } catch {
    return {
      isPresent: true,
      isValid: false,
      redactedUrl: '[invalid DATABASE_URL]',
      host: null,
      port: null,
      database: null,
      schema: null,
      sslmode: null,
      isLoopback: false,
    };
  }
}

export function formatDatabaseTargetForLogs(summary: DatabaseUrlSummary) {
  if (!summary.isPresent) {
    return 'DATABASE_URL is not set';
  }

  if (!summary.isValid) {
    return 'DATABASE_URL is invalid';
  }

  const parts = [
    `host=${summary.host ?? 'unknown'}`,
    `database=${summary.database ?? 'unknown'}`,
    `schema=${summary.schema ?? 'unknown'}`,
  ];

  if (summary.port !== null) {
    parts.push(`port=${summary.port}`);
  }

  if (summary.sslmode) {
    parts.push(`sslmode=${summary.sslmode}`);
  }

  parts.push(`loopback=${summary.isLoopback}`);
  return parts.join(', ');
}
