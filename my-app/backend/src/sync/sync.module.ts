import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { MutationLedgerService } from './mutation-ledger.service';
import { SyncChangePublisher } from './sync-change-publisher';
import { SyncController } from './sync.controller';
import { SyncPublisherService } from './sync-publisher.service';
import { SyncService } from './sync.service';

@Module({
  imports: [PrismaModule],
  controllers: [SyncController],
  providers: [
    SyncService,
    SyncPublisherService,
    MutationLedgerService,
    {
      provide: SyncChangePublisher,
      useExisting: SyncPublisherService,
    },
  ],
  exports: [
    SyncPublisherService,
    SyncChangePublisher,
    MutationLedgerService,
    SyncService,
  ],
})
export class SyncModule {}
