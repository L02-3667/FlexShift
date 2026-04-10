import { Module } from '@nestjs/common';

import { ActivityModule } from '../activity/activity.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';
import { SyncModule } from '../sync/sync.module';
import { OpenShiftsController } from './open-shifts.controller';
import { OpenShiftsService } from './open-shifts.service';

@Module({
  imports: [PrismaModule, NotificationsModule, SyncModule, ActivityModule],
  controllers: [OpenShiftsController],
  providers: [OpenShiftsService],
  exports: [OpenShiftsService],
})
export class OpenShiftsModule {}
