import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { ChangeInput, SyncChangePublisher } from './sync-change-publisher';

@Injectable()
export class SyncPublisherService extends SyncChangePublisher {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override async record(input: ChangeInput | ChangeInput[]) {
    const changes = Array.isArray(input) ? input : [input];

    if (changes.length === 0) {
      return;
    }

    await this.prisma.syncChange.createMany({
      data: changes.map((change) => ({
        domain: change.domain,
        entityType: change.entityType,
        entityId: change.entityId,
        operation: change.operation ?? 'upsert',
        userId: change.userId,
      })),
    });
  }
}
