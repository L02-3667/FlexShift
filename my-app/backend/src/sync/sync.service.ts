import { Injectable } from '@nestjs/common';
import type { ChecklistStatus } from '@prisma/client';

import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { QuerySyncDto } from './dto/query-sync.dto';

@Injectable()
export class SyncService {
  constructor(private readonly prisma: PrismaService) {}

  private async getLatestCursor() {
    const latest = await this.prisma.syncChange.aggregate({
      _max: {
        id: true,
      },
    });

    return latest._max.id ?? 0;
  }

  private async getShiftPayload(currentUser: AuthenticatedUser) {
    const shifts = await this.prisma.shift.findMany({
      where:
        currentUser.role === 'employee'
          ? {
              assignments: {
                some: {
                  userId: currentUser.sub,
                },
              },
            }
          : undefined,
      include: {
        store: true,
        position: true,
        assignments: {
          include: {
            user: true,
          },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return shifts.map((shift) => ({
      id: shift.id,
      employeeId: shift.assignments[0]?.userId ?? '',
      employeeName: shift.assignments[0]?.user.fullName ?? 'Chưa xếp',
      date: shift.date.toISOString().slice(0, 10),
      startTime: shift.startTime,
      endTime: shift.endTime,
      storeName: shift.store.name,
      position: shift.position.name,
      status: shift.status,
      updatedAt: shift.updatedAt.toISOString(),
    }));
  }

  private async getOpenShiftPayload() {
    const shifts = await this.prisma.openShift.findMany({
      include: {
        store: true,
        position: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return shifts.map((shift) => ({
      id: shift.id,
      date: shift.date.toISOString().slice(0, 10),
      startTime: shift.startTime,
      endTime: shift.endTime,
      storeName: shift.store.name,
      position: shift.position.name,
      note: shift.note,
      status: shift.status,
      claimedByEmployeeId: shift.claimedById,
      claimedByEmployeeName: null,
      updatedAt: shift.updatedAt.toISOString(),
    }));
  }

  private async getRequestPayload(currentUser: AuthenticatedUser) {
    const requests = await this.prisma.request.findMany({
      where:
        currentUser.role === 'employee'
          ? {
              createdById: currentUser.sub,
            }
          : undefined,
      include: {
        shift: {
          include: {
            store: true,
            position: true,
          },
        },
        createdBy: true,
        targetUser: true,
        approvalActions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        createdAt: currentUser.role === 'manager' ? 'asc' : 'desc',
      },
    });

    return requests.map((request) => ({
      id: request.id,
      type: request.type,
      createdByEmployeeId: request.createdById,
      shiftId: request.shiftId,
      targetEmployeeId: request.targetUserId,
      reason: request.reason,
      status: request.status,
      managerNote: request.managerNote,
      createdAt: request.createdAt.toISOString(),
      reviewedAt: request.approvalActions[0]?.createdAt?.toISOString() ?? null,
      createdByEmployeeName: request.createdBy.fullName,
      targetEmployeeName: request.targetUser?.fullName ?? null,
      shiftDate: request.shift.date.toISOString().slice(0, 10),
      shiftStartTime: request.shift.startTime,
      shiftEndTime: request.shift.endTime,
      shiftStoreName: request.shift.store.name,
      shiftPosition: request.shift.position.name,
      updatedAt: request.updatedAt.toISOString(),
    }));
  }

  private async getNotificationPayload(currentUser: AuthenticatedUser) {
    const notifications = await this.prisma.notification.findMany({
      where: {
        userId: currentUser.sub,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return notifications.map((notification) => ({
      id: notification.id,
      title: notification.title,
      body: notification.body,
      type: notification.type.replace(/_/g, '-') as string,
      isRead: notification.isRead,
      createdAt: notification.createdAt.toISOString(),
      updatedAt: notification.updatedAt.toISOString(),
    }));
  }

  private async getSettingsPayload(currentUser: AuthenticatedUser) {
    const setting = await this.prisma.userSetting.upsert({
      where: {
        userId: currentUser.sub,
      },
      update: {},
      create: {
        userId: currentUser.sub,
      },
    });

    return [
      {
        userId: setting.userId,
        notificationsEnabled: setting.notificationsEnabled,
        approvalUpdatesEnabled: setting.approvalUpdatesEnabled,
        openShiftAlertsEnabled: setting.openShiftAlertsEnabled,
        remindersEnabled: setting.remindersEnabled,
        reminderMinutesBefore: setting.reminderMinutesBefore,
        language: setting.language,
        theme: setting.theme,
        updatedAt: setting.updatedAt.toISOString(),
      },
    ];
  }

  private async getAnnouncementPayload(currentUser: AuthenticatedUser) {
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
            OR: [
              {
                scopeRole: null,
              },
              {
                scopeRole: currentUser.role,
              },
            ],
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

  private async getActivityPayload(currentUser: AuthenticatedUser) {
    const activity = await this.prisma.auditLog.findMany({
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
      take: 50,
    });

    return activity.map((event) => ({
      id: event.id,
      entityType: event.entityType,
      entityId: event.entityId,
      action: event.action,
      summary: event.summary,
      actorUserId: event.actorUserId,
      actorUserName: event.actorUser?.fullName ?? null,
      createdAt: event.createdAt.toISOString(),
      payload: event.payload,
    }));
  }

  private async getChecklistPayload(currentUser: AuthenticatedUser) {
    const checklists = await this.prisma.checklist.findMany({
      where:
        currentUser.role === 'manager'
          ? undefined
          : {
              OR: [
                {
                  assigneeId: currentUser.sub,
                },
                {
                  assigneeId: null,
                },
              ],
            },
      include: {
        items: {
          orderBy: {
            sortOrder: 'asc',
          },
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
      take: 50,
    });

    return checklists.map((checklist) => ({
      id: checklist.id,
      title: checklist.title,
      description: checklist.description,
      status: checklist.status as ChecklistStatus,
      assigneeId: checklist.assigneeId,
      dueAt: checklist.dueAt?.toISOString() ?? null,
      updatedAt: checklist.updatedAt.toISOString(),
      items: checklist.items.map((item) => ({
        id: item.id,
        label: item.label,
        sortOrder: item.sortOrder,
        isCompleted: item.isCompleted,
        completedAt: item.completedAt?.toISOString() ?? null,
      })),
    }));
  }

  private emptyDomain(cursor: number) {
    return {
      items: [],
      deletedIds: [],
      cursor,
    };
  }

  async pull(currentUser: AuthenticatedUser, query: QuerySyncDto) {
    const cursor = query.cursor ?? 0;
    const limit = Math.min(query.limit ?? 250, 500);
    const latestCursor = await this.getLatestCursor();

    const changes =
      cursor === 0
        ? []
        : await this.prisma.syncChange.findMany({
            where: {
              id: {
                gt: cursor,
              },
              OR: [
                {
                  userId: null,
                },
                {
                  userId: currentUser.sub,
                },
              ],
            },
            orderBy: {
              id: 'asc',
            },
            take: limit,
          });

    const nextCursor = changes.at(-1)?.id ?? latestCursor;
    const fullSync = cursor === 0;
    const changedDomains = new Set(changes.map((change) => change.domain));
    const shouldInclude = (domain: string) =>
      fullSync || changedDomains.has(domain);

    return {
      cursor: nextCursor,
      serverCursor: latestCursor,
      hasMore: !fullSync && nextCursor < latestCursor,
      serverTime: new Date().toISOString(),
      staleAfterMs: 5 * 60 * 1000,
      domains: {
        shifts: shouldInclude('shifts')
          ? {
              items: await this.getShiftPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        openShifts: shouldInclude('open-shifts')
          ? {
              items: await this.getOpenShiftPayload(),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        requests: shouldInclude('requests')
          ? {
              items: await this.getRequestPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        notifications: shouldInclude('notifications')
          ? {
              items: await this.getNotificationPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        settings: shouldInclude('settings')
          ? {
              items: await this.getSettingsPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        announcements: shouldInclude('announcements')
          ? {
              items: await this.getAnnouncementPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        activity: shouldInclude('activity')
          ? {
              items: await this.getActivityPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
        checklists: shouldInclude('checklists')
          ? {
              items: await this.getChecklistPayload(currentUser),
              deletedIds: [],
              cursor: nextCursor,
            }
          : this.emptyDomain(cursor),
      },
    };
  }
}
