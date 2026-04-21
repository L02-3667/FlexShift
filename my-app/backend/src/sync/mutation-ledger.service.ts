import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MutationLedgerService {
  constructor(private readonly prisma: PrismaService) {}

  find(clientMutationId: string, userId: string) {
    return this.prisma.mutationRecord.findFirst({
      where: {
        clientMutationId,
        userId,
      },
    });
  }

  findByDedupeKey(userId: string, mutationType: string, dedupeKey?: string) {
    if (!dedupeKey) {
      return null;
    }

    return this.prisma.mutationRecord.findFirst({
      where: {
        userId,
        mutationType,
        dedupeKey,
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }

  async findExisting(input: {
    clientMutationId?: string;
    userId: string;
    mutationType: string;
    dedupeKey?: string;
  }) {
    if (input.clientMutationId) {
      const existingByClientMutationId = await this.find(
        input.clientMutationId,
        input.userId,
      );

      if (existingByClientMutationId) {
        return existingByClientMutationId;
      }
    }

    return this.findByDedupeKey(
      input.userId,
      input.mutationType,
      input.dedupeKey,
    );
  }

  async complete(input: {
    clientMutationId: string;
    userId: string;
    mutationType: string;
    entityType?: string;
    entityId?: string;
    dedupeKey?: string;
    response: unknown;
  }) {
    return this.prisma.mutationRecord.upsert({
      where: {
        clientMutationId: input.clientMutationId,
      },
      update: {
        mutationType: input.mutationType,
        entityType: input.entityType,
        entityId: input.entityId,
        dedupeKey: input.dedupeKey,
        response: input.response as object,
      },
      create: {
        clientMutationId: input.clientMutationId,
        userId: input.userId,
        mutationType: input.mutationType,
        entityType: input.entityType,
        entityId: input.entityId,
        dedupeKey: input.dedupeKey,
        response: input.response as object,
      },
    });
  }
}
