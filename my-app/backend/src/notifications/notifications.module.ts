import { Module } from '@nestjs/common';

import { ActivityModule } from '../activity/activity.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncModule } from '../sync/sync.module';
import { NotificationGateway } from './notification-gateway';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';

@Module({
  imports: [PrismaModule, SyncModule, ActivityModule],
  controllers: [NotificationsController],
  providers: [
    NotificationsService,
    {
      provide: NotificationGateway,
      useExisting: NotificationsService,
    },
  ],
  exports: [NotificationsService, NotificationGateway],
})
export class NotificationsModule {}
