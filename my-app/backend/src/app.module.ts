import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';

import { ApprovalsModule } from './approvals/approvals.module';
import { AnnouncementsModule } from './announcements/announcements.module';
import { ActivityModule } from './activity/activity.module';
import { AuthModule } from './auth/auth.module';
import { CalendarModule } from './calendar/calendar.module';
import { validateEnv } from './config/env';
import { RolesGuard } from './common/guards/roles.guard';
import { RequestContextMiddleware } from './common/http/request-context.middleware';
import { HealthModule } from './health/health.module';
import { NotificationsModule } from './notifications/notifications.module';
import { OpenShiftsModule } from './open-shifts/open-shifts.module';
import { PrismaModule } from './prisma/prisma.module';
import { RequestsModule } from './requests/requests.module';
import { SessionsModule } from './sessions/sessions.module';
import { SettingsModule } from './settings/settings.module';
import { ShiftsModule } from './shifts/shifts.module';
import { StatisticsModule } from './statistics/statistics.module';
import { SyncModule } from './sync/sync.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env.local', '.env.development', '.env'],
      validate: validateEnv,
    }),
    PrismaModule,
    HealthModule,
    ActivityModule,
    SyncModule,
    AnnouncementsModule,
    UsersModule,
    SessionsModule,
    AuthModule,
    NotificationsModule,
    SettingsModule,
    ShiftsModule,
    OpenShiftsModule,
    RequestsModule,
    ApprovalsModule,
    CalendarModule,
    StatisticsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestContextMiddleware).forRoutes('*');
  }
}
