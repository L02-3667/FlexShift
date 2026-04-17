import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { ActivityWriter } from '../activity/activity-writer';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { NotificationGateway } from '../notifications/notification-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { UpdateAnnouncementDto } from './dto/update-announcement.dto';

@Injectable()
export class AnnouncementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationGateway,
    private readonly syncPublisher: SyncChangePublisher,
    private readonly activityService: ActivityWriter,
  ) {}

  private buildVisibilityWhere(
    currentUser: AuthenticatedUser,
  ): Prisma.AnnouncementWhereInput {
    const now = new Date();

    return {
      publishedAt: {
        lte: now,
      },
      OR: [
        {
          expiresAt: null,
        },
        {
          expiresAt: {
            gt: now,
          },
        },
      ],
      AND: [
        {
          OR: [{ scopeRole: null }, { scopeRole: currentUser.role }],
        },
      ],
    };
  }

  private mapAnnouncement(
    announcement: {
      id: string;
      title: string;
      body: string;
      scopeRole: 'employee' | 'manager' | 'admin' | null;
      requiresAck: boolean;
      publishedAt: Date;
      expiresAt: Date | null;
      updatedAt: Date;
      acknowledgements?: Array<{ acknowledgedAt: Date }>;
    },
    acknowledgedAt?: string | null,
  ) {
    return {
      id: announcement.id,
      title: announcement.title,
      body: announcement.body,
      scopeRole: announcement.scopeRole,
      requiresAck: announcement.requiresAck,
      acknowledgedAt:
        acknowledgedAt ??
        announcement.acknowledgements?.[0]?.acknowledgedAt?.toISOString() ??
        null,
      publishedAt: announcement.publishedAt.toISOString(),
      expiresAt: announcement.expiresAt?.toISOString() ?? null,
      updatedAt: announcement.updatedAt.toISOString(),
    };
  }

  async list(currentUser: AuthenticatedUser) {
    const announcements = await this.prisma.announcement.findMany({
      where: this.buildVisibilityWhere(currentUser),
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

    return announcements.map((announcement) => this.mapAnnouncement(announcement));
  }

  async findOne(currentUser: AuthenticatedUser, id: string) {
    const canManageAll =
      currentUser.role === 'manager' || currentUser.role === 'admin';

    const announcement = canManageAll
      ? await this.prisma.announcement.findUnique({
          where: { id },
          include: {
            acknowledgements: {
              where: {
                userId: currentUser.sub,
              },
              take: 1,
            },
          },
        })
      : await this.prisma.announcement.findFirst({
          where: {
            id,
            ...this.buildVisibilityWhere(currentUser),
          },
          include: {
            acknowledgements: {
              where: {
                userId: currentUser.sub,
              },
              take: 1,
            },
          },
        });

    if (!announcement) {
      throw new NotFoundException('Không tìm thấy thông báo.');
    }

    return this.mapAnnouncement(announcement);
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
          title: announcement.title,
          body: announcement.body,
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
      summary: `Đã đăng thông báo "${announcement.title}"`,
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

    return this.mapAnnouncement(announcement, null);
  }

  async update(
    currentUser: AuthenticatedUser,
    id: string,
    input: UpdateAnnouncementDto,
  ) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Không tìm thấy thông báo.');
    }

    const updatedAnnouncement = await this.prisma.announcement.update({
      where: { id },
      data: {
        ...(input.title !== undefined ? { title: input.title.trim() } : {}),
        ...(input.body !== undefined ? { body: input.body.trim() } : {}),
        ...(input.scopeRole !== undefined ? { scopeRole: input.scopeRole } : {}),
        ...(input.requiresAck !== undefined
          ? { requiresAck: input.requiresAck }
          : {}),
      },
    });

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'announcement',
      entityId: updatedAnnouncement.id,
      action: 'announcement.updated',
      summary: `Đã cập nhật thông báo "${updatedAnnouncement.title}"`,
    });

    await this.syncPublisher.record([
      {
        domain: 'announcements',
        entityType: 'announcement',
        entityId: updatedAnnouncement.id,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: updatedAnnouncement.id,
      },
    ]);

    return this.mapAnnouncement(updatedAnnouncement, null);
  }

  async remove(currentUser: AuthenticatedUser, id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('Không tìm thấy thông báo.');
    }

    await this.prisma.$transaction([
      this.prisma.announcementAck.deleteMany({
        where: {
          announcementId: id,
        },
      }),
      this.prisma.announcement.delete({
        where: { id },
      }),
    ]);

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'announcement',
      entityId: id,
      action: 'announcement.deleted',
      summary: `Đã xóa thông báo "${announcement.title}"`,
    });

    await this.syncPublisher.record([
      {
        domain: 'announcements',
        entityType: 'announcement',
        entityId: id,
        operation: 'delete',
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: id,
      },
    ]);

    return { success: true };
  }

  async acknowledge(currentUser: AuthenticatedUser, id: string) {
    const announcement = await this.prisma.announcement.findFirst({
      where: {
        id,
        ...this.buildVisibilityWhere(currentUser),
      },
    });

    if (!announcement) {
      throw new NotFoundException('Không tìm thấy thông báo.');
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
      summary: `Đã xác nhận đã đọc thông báo "${announcement.title}"`,
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
