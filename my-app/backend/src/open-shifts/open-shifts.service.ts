import { Injectable, NotFoundException } from '@nestjs/common';

import { ActivityWriter } from '../activity/activity-writer';
import { DomainConflictException } from '../common/exceptions/domain-conflict.exception';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { checkShiftConflict } from '../common/policies/schedule-conflict.policy';
import { getConflictWindowBounds } from '../common/utils/shift.utils';
import { NotificationGateway } from '../notifications/notification-gateway';
import { mapOpenShiftForMobile, mapShiftForMobile } from './open-shift.mapper';
import { PrismaService } from '../prisma/prisma.service';
import { MutationLedgerService } from '../sync/mutation-ledger.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';
import { ClaimOpenShiftDto } from './dto/claim-open-shift.dto';
import { CreateOpenShiftDto } from './dto/create-open-shift.dto';

@Injectable()
export class OpenShiftsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationGateway,
    private readonly mutationLedger: MutationLedgerService,
    private readonly syncPublisher: SyncChangePublisher,
    private readonly activityService: ActivityWriter,
  ) {}

  private buildOpenShiftUnavailableConflict(openShiftId: string) {
    return new DomainConflictException({
      code: 'OPEN_SHIFT_ALREADY_CLAIMED',
      message: 'Ca trống này không còn khả dụng.',
      entityType: 'open_shift',
      entityId: openShiftId,
      recoverable: true,
      retryable: false,
      resolution: 'Làm mới danh sách ca trống để nhận trạng thái mới nhất.',
    });
  }

  private async ensureStoreAndPosition(
    storeName: string,
    positionName: string,
  ) {
    const code = storeName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const store = await this.prisma.store.upsert({
      where: { code },
      update: { name: storeName },
      create: {
        code,
        name: storeName,
      },
    });

    const position = await this.prisma.position.upsert({
      where: { name: positionName },
      update: {},
      create: {
        name: positionName,
      },
    });

    return {
      store,
      position,
    };
  }

  async list() {
    const openShifts = await this.prisma.openShift.findMany({
      where: {
        status: 'open',
      },
      include: {
        store: true,
        position: true,
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    });

    return openShifts.map((openShift) => mapOpenShiftForMobile(openShift));
  }

  async findOne(id: string) {
    const openShift = await this.prisma.openShift.findUnique({
      where: { id },
      include: {
        store: true,
        position: true,
      },
    });

    if (!openShift) {
      throw new NotFoundException('Không tìm thấy ca trống.');
    }

    return mapOpenShiftForMobile(openShift);
  }

  async create(currentUser: AuthenticatedUser, input: CreateOpenShiftDto) {
    const existing = await this.mutationLedger.findExisting({
      clientMutationId: input.clientMutationId,
      userId: currentUser.sub,
      mutationType: 'open_shift.create',
      dedupeKey: input.dedupeKey,
    });

    if (existing?.response) {
      return existing.response;
    }

    const { store, position } = await this.ensureStoreAndPosition(
      input.storeName,
      input.position,
    );

    const openShift = await this.prisma.openShift.create({
      data: {
        date: new Date(`${input.date}T00:00:00.000Z`),
        startTime: input.startTime,
        endTime: input.endTime,
        note: input.note,
        storeId: store.id,
        positionId: position.id,
      },
      include: {
        store: true,
        position: true,
      },
    });

    const employees = await this.prisma.user.findMany({
      where: {
        role: 'employee',
        isActive: true,
      },
    });

    await Promise.all(
      employees.map((employee) =>
        this.notificationsService.createNotification({
          userId: employee.id,
          title: 'Ca cần bạn',
          body: `${position.name} tại ${store.name} vừa được mở.`,
          type: 'open_shift_match',
        }),
      ),
    );

    const response = mapOpenShiftForMobile(openShift);

    if (input.clientMutationId) {
      await this.mutationLedger.complete({
        clientMutationId: input.clientMutationId,
        userId: currentUser.sub,
        mutationType: 'open_shift.create',
        entityType: 'open_shift',
        entityId: openShift.id,
        dedupeKey: input.dedupeKey,
        response,
      });
    }

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'open_shift',
      entityId: openShift.id,
      action: 'open_shift.created',
      summary: `Created open shift ${position.name} at ${store.name}`,
      payload: {
        date: input.date,
        startTime: input.startTime,
        endTime: input.endTime,
      },
    });
    await this.syncPublisher.record([
      {
        domain: 'open-shifts',
        entityType: 'open_shift',
        entityId: openShift.id,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: openShift.id,
      },
    ]);

    return response;
  }

  async claim(
    id: string,
    currentUser: AuthenticatedUser,
    input: ClaimOpenShiftDto = {},
  ) {
    const existing = await this.mutationLedger.findExisting({
      clientMutationId: input.clientMutationId,
      userId: currentUser.sub,
      mutationType: 'open_shift.claim',
      dedupeKey: input.dedupeKey,
    });

    if (existing?.response) {
      return existing.response;
    }

    const openShift = await this.prisma.openShift.findUnique({
      where: { id },
      include: {
        store: true,
        position: true,
      },
    });

    if (!openShift) {
      throw new NotFoundException('Không tìm thấy ca trống.');
    }

    if (openShift.status !== 'open') {
      throw this.buildOpenShiftUnavailableConflict(openShift.id);
    }

    const conflictWindow = getConflictWindowBounds(openShift.date);
    const nearbyAssignments = await this.prisma.shiftAssignment.findMany({
      where: {
        userId: currentUser.sub,
        shift: {
          date: {
            gte: conflictWindow.start,
            lt: conflictWindow.end,
          },
          status: 'scheduled',
        },
      },
      include: {
        shift: true,
      },
    });

    const isConflict = checkShiftConflict(
      nearbyAssignments.map((assignment) => assignment.shift),
      openShift,
    );

    if (isConflict) {
      throw new DomainConflictException({
        code: 'SHIFT_CLAIM_OVERLAP',
        message: 'Bạn đã có ca trùng thời gian nên không thể nhận ca này.',
        entityType: 'shift',
        entityId: openShift.id,
        recoverable: true,
        retryable: false,
        resolution: 'Chọn một ca khác không trùng lịch hiện tại.',
      });
    }

    const createdShift = await this.prisma.$transaction(async (tx) => {
      const claimResult = await tx.openShift.updateMany({
        where: {
          id: openShift.id,
          status: 'open',
        },
        data: {
          status: 'claimed',
          claimedById: currentUser.sub,
        },
      });

      if (claimResult.count === 0) {
        throw this.buildOpenShiftUnavailableConflict(openShift.id);
      }

      return tx.shift.create({
        data: {
          date: openShift.date,
          startTime: openShift.startTime,
          endTime: openShift.endTime,
          status: 'scheduled',
          storeId: openShift.storeId,
          positionId: openShift.positionId,
          assignments: {
            create: {
              userId: currentUser.sub,
            },
          },
        },
        include: {
          store: true,
          position: true,
          assignments: {
            include: {
              user: true,
            },
          },
        },
      });
    });

    await this.notificationsService.createNotification({
      userId: currentUser.sub,
      title: 'Ca đã được xác nhận',
      body: `${createdShift.position.name} tại ${createdShift.store.name} đã vào lịch của bạn.`,
      type: 'shift_assigned',
    });

    const response = mapShiftForMobile(createdShift);

    if (input.clientMutationId) {
      await this.mutationLedger.complete({
        clientMutationId: input.clientMutationId,
        userId: currentUser.sub,
        mutationType: 'open_shift.claim',
        entityType: 'shift',
        entityId: createdShift.id,
        dedupeKey: input.dedupeKey,
        response,
      });
    }

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'shift',
      entityId: createdShift.id,
      action: 'open_shift.claimed',
      summary: `Claimed open shift ${createdShift.position.name} at ${createdShift.store.name}`,
      payload: {
        openShiftId: openShift.id,
      },
    });
    await this.syncPublisher.record([
      {
        domain: 'open-shifts',
        entityType: 'open_shift',
        entityId: openShift.id,
      },
      {
        domain: 'shifts',
        entityType: 'shift',
        entityId: createdShift.id,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: createdShift.id,
      },
    ]);

    return response;
  }
}
