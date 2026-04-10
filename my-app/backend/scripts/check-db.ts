import { PrismaClient } from '@prisma/client';
import { loadProjectEnv } from './load-env';

async function main() {
  loadProjectEnv();
  const prisma = new PrismaClient();

  try {
    const result = await prisma.$queryRawUnsafe<Array<{ now: string }>>(
      'SELECT NOW()::text as now',
    );

    console.log(
      JSON.stringify(
        {
          status: 'ok',
          databaseUrl: process.env.DATABASE_URL,
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
