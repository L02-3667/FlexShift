import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

import {
  formatDatabaseTargetForLogs,
  summarizeDatabaseUrl,
} from '../config/database-url';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    await this.$connect();
    const databaseSummary = summarizeDatabaseUrl(process.env.DATABASE_URL);
    this.logger.log(
      `Connected to PostgreSQL (${formatDatabaseTargetForLogs(databaseSummary)}).`,
    );

    if (
      databaseSummary.isLoopback &&
      (process.env.APP_ENV === 'production' || process.env.APP_ENV === 'staging')
    ) {
      this.logger.warn(
        'DATABASE_URL resolves to a loopback host. Production and staging should use the Neon/managed PostgreSQL runtime secret instead of localhost.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async checkReadiness() {
    await this.$queryRaw`SELECT 1`;
    return true;
  }
}
