import { Injectable } from '@nestjs/common';

import {
  CreateNotificationInput,
  NotificationGateway,
} from './notification-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';

@Injectable()
export class NotificationsService extends NotificationGateway {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncPublisher: SyncChangePublisher,
  ) {
    super();
  }

  async list(userId: string) {
    const notifications = await this.prisma.notification.findMany({
      where: { userId },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type.replace(/_/g, '-') as
        | 'request-approved'
        | 'request-rejected'
        | 'shift-assigned'
        | 'open-shift-match'
        | 'schedule-updated'
        | 'announcement-published',
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    }));
  }

  override async createNotification(input: CreateNotificationInput) {
    const notification = await this.prisma.notification.create({
      data: input,
    });

    await this.syncPublisher.record({
      domain: 'notifications',
      entityType: 'notification',
      entityId: notification.id,
      userId: notification.userId,
    });

    return notification;
  }

  async markRead(userId: string, id: string) {
    const result = await this.prisma.notification.updateMany({
      where: {
        id,
        userId,
      },
      data: {
        isRead: true,
      },
    });

    if (result.count > 0) {
      await this.syncPublisher.record({
        domain: 'notifications',
        entityType: 'notification',
        entityId: id,
        userId,
      });
    }

    return { success: true };
  }
}
