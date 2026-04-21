import { PrismaClient } from '@prisma/client';
import {
  formatDatabaseTargetForLogs,
  summarizeDatabaseUrl,
} from '../src/config/database-url';
import { findProjectEnvValue, loadProjectEnv } from './load-env';

function resolveDatabaseUrlSource(inheritedDatabaseUrl: string | undefined) {
  if (inheritedDatabaseUrl) {
    return 'process.env';
  }

  return findProjectEnvValue('DATABASE_URL')?.fileName ?? null;
}

async function main() {
  const inheritedDatabaseUrl = process.env.DATABASE_URL;
  loadProjectEnv();
  const databaseSummary = summarizeDatabaseUrl(process.env.DATABASE_URL);
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRawUnsafe<Array<{ now: string }>>(
      'SELECT NOW()::text as now',
    );

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          source: resolveDatabaseUrlSource(inheritedDatabaseUrl),
          databaseUrl: databaseSummary.redactedUrl,
          databaseTarget: {
            host: databaseSummary.host,
            port: databaseSummary.port,
            database: databaseSummary.database,
            schema: databaseSummary.schema,
            sslmode: databaseSummary.sslmode,
            isLoopback: databaseSummary.isLoopback,
            summary: formatDatabaseTargetForLogs(databaseSummary),
          },
          serverTime: result[0]?.now ?? null,
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
