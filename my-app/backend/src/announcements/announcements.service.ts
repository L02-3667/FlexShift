import { Injectable, NotFoundException } from '@nestjs/common';

import { ActivityWriter } from '../activity/activity-writer';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { NotificationGateway } from '../notifications/notification-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationGateway,
    private readonly syncPublisher: SyncChangePublisher,
    private readonly activityService: ActivityWriter,
  ) {}

  async list(currentUser: AuthenticatedUser) {
    const announcements = await this.prisma.announcement.findMany({
      where: {
        publishedAt: {
          lte: new Date(),
        },
        OR: [
          {
            expiresAt: null,
          },
          {
            expiresAt: {
              gt: new Date(),
            },
          },
        ],
        AND: [
          {
            OR: [{ scopeRole: null }, { scopeRole: currentUser.role }],
          },
        ],
      },
      include: {
        acknowledgements: {
          where: {
            userId: currentUser.sub,
          },
          take: 1,
        },
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });

    return announcements.map((announcement) => ({
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      requiresAck: announcement.requiresAck,
      acknowledgedAt:
        announcement.acknowledgements[0]?.acknowledgedAt?.toISOString() ?? null,
      publishedAt: announcement.publishedAt.toISOString(),
      expiresAt: announcement.expiresAt?.toISOString() ?? null,
      updatedAt: announcement.updatedAt.toISOString(),
    }));
  }

  async create(currentUser: AuthenticatedUser, input: CreateAnnouncementDto) {
    const announcement = await this.prisma.announcement.create({
      data: {
        title: input.title.trim(),
        body: input.body.trim(),
        scopeRole: input.scopeRole,
        requiresAck: input.requiresAck,
        createdById: currentUser.sub,
      },
    });

    const recipients = await this.prisma.user.findMany({
      where: {
        isActive: true,
        ...(input.scopeRole ? { role: input.scopeRole } : {}),
      },
      select: {
        id: true,
      },
    });

    await Promise.all(
      recipients.map((recipient) =>
        this.notificationsService.createNotification({
          userId: recipient.id,
          title: input.title.trim(),
          body: input.body.trim(),
          type: 'announcement_published',
        }),
      ),
    );

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'announcement',
      entityId: announcement.id,
      action: 'announcement.created',
      summary: `Published announcement "${announcement.title}"`,
      payload: {
        scopeRole: announcement.scopeRole,
        requiresAck: announcement.requiresAck,
      },
    });

    await this.syncPublisher.record([
      {
        domain: 'announcements',
        entityType: 'announcement',
        entityId: announcement.id,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: announcement.id,
      },
    ]);

    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      requiresAck: announcement.requiresAck,
      publishedAt: announcement.publishedAt.toISOString(),
      updatedAt: announcement.updatedAt.toISOString(),
    };
  }

  async acknowledge(currentUser: AuthenticatedUser, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: {
        id,
      },
    });

    if (!announcement) {
      throw new NotFoundException('Khong tim thay thong bao.');
    }

    const acknowledgement = await this.prisma.announcementAck.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId: currentUser.sub,
        },
      },
      update: {
        acknowledgedAt: new Date(),
      },
      create: {
        announcementId: id,
        userId: currentUser.sub,
      },
    });

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'announcement',
      entityId: announcement.id,
      action: 'announcement.acknowledged',
      summary: `Acknowledged announcement "${announcement.title}"`,
    });

    await this.syncPublisher.record([
      {
        domain: 'announcements',
        entityType: 'announcement',
        entityId: announcement.id,
        userId: currentUser.sub,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: announcement.id,
      },
    ]);

    return {
      success: true,
      acknowledgedAt: acknowledgement.acknowledgedAt.toISOString(),
    };
  }
}
