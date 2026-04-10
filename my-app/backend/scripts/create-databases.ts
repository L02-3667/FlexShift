import { PrismaClient } from '@prisma/client';

import { loadProjectEnv } from './load-env';

function getRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function escapeIdentifier(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildAdminDatabaseUrl() {
  const host = getRequiredEnv('POSTGRES_HOST', '127.0.0.1');
  const port = getRequiredEnv('POSTGRES_PORT', '5432');
  const user = encodeURIComponent(getRequiredEnv('POSTGRES_USER', 'postgres'));
  const password = encodeURIComponent(
    getRequiredEnv('POSTGRES_PASSWORD', '123456'),
  );

  return `postgresql://${user}:${password}@${host}:${port}/postgres?schema=public`;
}

async function ensureDatabase(prisma: PrismaClient, databaseName: string) {
  const result = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM pg_database
      WHERE datname = ${databaseName}
    ) AS "exists"
  `;

  if (result[0]?.exists) {
    return 'already_exists';
  }

  await prisma.$executeRawUnsafe(
    `CREATE DATABASE ${escapeIdentifier(databaseName)}`,
  );
  return 'created';
}

async function main() {
  loadProjectEnv();

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: buildAdminDatabaseUrl(),
      },
    },
  });

  const databaseName = getRequiredEnv('POSTGRES_DB', 'flexshift');
  const shadowDatabaseName = getRequiredEnv(
    'POSTGRES_SHADOW_DB',
    'flexshift_shadow',
  );

  try {
    const databaseStatus = await ensureDatabase(prisma, databaseName);
    const shadowDatabaseStatus = await ensureDatabase(
      prisma,
      shadowDatabaseName,
    );

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          database: {
            name: databaseName,
            status: databaseStatus,
          },
          shadowDatabase: {
            name: shadowDatabaseName,
            status: shadowDatabaseStatus,
          },
        },
        null,
        2,
      ),
    );
  } finally {
    await prisma.$disconnect();
  }
}

void main().catch((error) => {
  console.error(error);
  process.exit(1);
});
