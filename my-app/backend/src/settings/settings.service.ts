import { Injectable } from '@nestjs/common';

import { ActivityWriter } from '../activity/activity-writer';
import { PrismaService } from '../prisma/prisma.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';
import { UpdateUserSettingDto } from './dto/update-user-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly syncPublisher: SyncChangePublisher,
    private readonly activityService: ActivityWriter,
  ) {}

  async getForUser(userId: string) {
    const setting = await this.prisma.userSetting.upsert({
      where: { userId },
      update: {},
      create: {
        userId,
      },
    });

    return {
      userId: setting.userId,
      notificationsEnabled: setting.notificationsEnabled,
      approvalUpdatesEnabled: setting.approvalUpdatesEnabled,
      openShiftAlertsEnabled: setting.openShiftAlertsEnabled,
      remindersEnabled: setting.remindersEnabled,
      reminderMinutesBefore: setting.reminderMinutesBefore,
      language: setting.language,
      theme: setting.theme,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }

  async updateForUser(userId: string, input: UpdateUserSettingDto) {
    const setting = await this.prisma.userSetting.upsert({
      where: { userId },
      update: input,
      create: {
        userId,
        ...input,
      },
    });

    await this.activityService.record({
      actorUserId: userId,
      entityType: 'user_setting',
      entityId: setting.userId,
      action: 'settings.updated',
      summary: 'Updated mobile settings preferences',
      payload: input,
    });
    await this.syncPublisher.record([
      {
        domain: 'settings',
        entityType: 'user_setting',
        entityId: setting.userId,
        userId,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: setting.userId,
      },
    ]);

    return {
      userId: setting.userId,
      notificationsEnabled: setting.notificationsEnabled,
      approvalUpdatesEnabled: setting.approvalUpdatesEnabled,
      openShiftAlertsEnabled: setting.openShiftAlertsEnabled,
      remindersEnabled: setting.remindersEnabled,
      reminderMinutesBefore: setting.reminderMinutesBefore,
      language: setting.language,
      theme: setting.theme,
      updatedAt: setting.updatedAt.toISOString(),
    };
  }
}
