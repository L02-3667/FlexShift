import { Injectable } from '@nestjs/common';

import { ActivityWriter, type AuditInput } from './activity-writer';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService extends ActivityWriter {
  constructor(private readonly prisma: PrismaService) {
    super();
  }

  override record(input: AuditInput) {
    return this.prisma.auditLog.create({
      data: {
        actorUserId: input.actorUserId,
        sessionId: input.sessionId,
        requestId: input.requestId,
        deviceId: input.deviceId,
        entityType: input.entityType,
        entityId: input.entityId,
        action: input.action,
        summary: input.summary,
        payload: input.payload as object | undefined,
      },
    });
  }

  async list(currentUser: AuthenticatedUser, limit = 25) {
    const logs = await this.prisma.auditLog.findMany({
      where:
        currentUser.role === 'manager'
          ? undefined
          : {
              actorUserId: currentUser.sub,
            },
      include: {
        actorUser: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: Math.min(Math.max(limit, 1), 100),
    });

    return logs.map((log) => ({
      id: log.id,
      entityType: log.entityType,
      entityId: log.entityId,
      action: log.action,
      summary: log.summary,
      actorUserId: log.actorUserId,
      actorUserName: log.actorUser?.fullName ?? null,
      createdAt: log.createdAt.toISOString(),
      payload: log.payload,
    }));
  }
}
