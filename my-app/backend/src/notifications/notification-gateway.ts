import type { NotificationType } from '@prisma/client';

export interface CreateNotificationInput {
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
}

export abstract class NotificationGateway {
  abstract createNotification(input: CreateNotificationInput): Promise<unknown>;
}
