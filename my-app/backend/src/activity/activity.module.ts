import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { ActivityWriter } from './activity-writer';
import { ActivityController } from './activity.controller';
import { ActivityService } from './activity.service';

@Module({
  imports: [PrismaModule],
  controllers: [ActivityController],
  providers: [
    ActivityService,
    {
      provide: ActivityWriter,
      useExisting: ActivityService,
    },
  ],
  exports: [ActivityService, ActivityWriter],
})
export class ActivityModule {}
