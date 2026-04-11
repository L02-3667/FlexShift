import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { ActivityWriter } from '../activity/activity-writer';
import { DomainConflictException } from '../common/exceptions/domain-conflict.exception';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { checkShiftConflict } from '../common/policies/schedule-conflict.policy';
import { getConflictWindowBounds } from '../common/utils/shift.utils';
import { NotificationGateway } from '../notifications/notification-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { MutationLedgerService } from '../sync/mutation-ledger.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';
import { ReviewRequestDto } from './dto/review-request.dto';

@Injectable()
export class ApprovalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationGateway,
    private readonly mutationLedger: MutationLedgerService,
    private readonly syncPublisher: SyncChangePublisher,
    private readonly activityService: ActivityWriter,
  ) {}

  private buildAlreadyReviewedConflict(requestId: string) {
    return new DomainConflictException({
      code: 'REQUEST_ALREADY_REVIEWED',
      message: 'Yeu cau nay da duoc xu ly truoc do.',
      entityType: 'request',
      entityId: requestId,
      recoverable: true,
      retryable: false,
      resolution: 'Lam moi trang chi tiet yeu cau de xem ket qua moi nhat.',
    });
  }

  async approve(
    currentUser: AuthenticatedUser,
    requestId: string,
    input: ReviewRequestDto,
  ) {
    const existing = await this.mutationLedger.findExisting({
      clientMutationId: input.clientMutationId,
      userId: currentUser.sub,
      mutationType: 'approval.approve',
      dedupeKey: input.dedupeKey,
    });

    if (existing?.response) {
      return existing.response;
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
      include: {
        shift: {
          include: {
            store: true,
            position: true,
            assignments: true,
          },
        },
        createdBy: true,
        targetUser: true,
      },
    });

    if (!request) {
      throw new NotFoundException('Khong tim thay yeu cau can duyet.');
    }

    if (request.status !== 'pending') {
      throw this.buildAlreadyReviewedConflict(request.id);
    }

    let derivedOpenShiftId: string | null = null;
    const reviewNote = input.note?.trim() ?? null;

    if (request.type === 'leave') {
      const reopenedOpenShift = await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.request.updateMany({
          where: {
            id: requestId,
            status: 'pending',
          },
          data: {
            status: 'approved',
            managerNote: reviewNote,
          },
        });

        if (updateResult.count === 0) {
          throw this.buildAlreadyReviewedConflict(requestId);
        }

        await tx.approvalAction.create({
          data: {
            requestId,
            managerId: currentUser.sub,
            action: 'approved',
            note: reviewNote,
          },
        });

        await tx.shift.update({
          where: { id: request.shiftId },
          data: {
            status: 'cancelled',
          },
        });

        return tx.openShift.create({
          data: {
            storeId: request.shift.storeId,
            positionId: request.shift.positionId,
            date: request.shift.date,
            startTime: request.shift.startTime,
            endTime: request.shift.endTime,
            note: `Ca phat sinh tu yeu cau nghi: ${request.reason}`,
          },
        });
      });

      derivedOpenShiftId = reopenedOpenShift.id;
    } else {
      if (!request.targetUserId) {
        throw new BadRequestException('Yeu cau nhuong ca thieu nguoi nhan.');
      }

      const targetUserId = request.targetUserId;
      const conflictWindow = getConflictWindowBounds(request.shift.date);

      const conflictingAssignments = await this.prisma.shiftAssignment.findMany(
        {
          where: {
            userId: targetUserId,
            shift: {
              date: {
                gte: conflictWindow.start,
                lt: conflictWindow.end,
              },
              status: 'scheduled',
              id: {
                not: request.shiftId,
              },
            },
          },
          include: {
            shift: true,
          },
        },
      );

      const hasConflict = checkShiftConflict(
        conflictingAssignments.map((assignment) => assignment.shift),
        request.shift,
      );

      if (hasConflict) {
        throw new DomainConflictException({
          code: 'APPROVAL_RACE_CONFLICT',
          message: 'Nguoi nhan ca dang co lich trung thoi gian.',
          entityType: 'request',
          entityId: request.id,
          recoverable: true,
          retryable: false,
          resolution:
            'Chon dong nghiep khac hoac cap nhat lai yeu cau nhuong ca.',
        });
      }

      const currentAssignment = request.shift.assignments[0];

      await this.prisma.$transaction(async (tx) => {
        const updateResult = await tx.request.updateMany({
          where: {
            id: requestId,
            status: 'pending',
          },
          data: {
            status: 'approved',
            managerNote: reviewNote,
          },
        });

        if (updateResult.count === 0) {
          throw this.buildAlreadyReviewedConflict(requestId);
        }

        await tx.approvalAction.create({
          data: {
            requestId,
            managerId: currentUser.sub,
            action: 'approved',
            note: reviewNote,
          },
        });

        if (currentAssignment) {
          await tx.shiftAssignment.update({
            where: { id: currentAssignment.id },
            data: {
              userId: targetUserId,
            },
          });
        }
      });
    }

    await this.notificationsService.createNotification({
      userId: request.createdById,
      title: 'Yeu cau da duoc duyet',
      body:
        request.type === 'leave'
          ? 'Don xin nghi cua ban da duoc chap thuan.'
          : 'De nghi nhuong ca cua ban da duoc chap thuan.',
      type: 'request_approved',
    });

    if (request.type === 'yield' && request.targetUserId) {
      await this.notificationsService.createNotification({
        userId: request.targetUserId,
        title: 'Ban vua duoc giao ca',
        body: `${request.shift.position.name} tai ${request.shift.store.name} da duoc chuyen sang lich cua ban.`,
        type: 'shift_assigned',
      });
    }

    const response = {
      requestId,
      managerId: currentUser.sub,
      action: 'approved' as const,
      managerNote: reviewNote ?? undefined,
      reviewedAt: new Date().toISOString(),
    };

    if (input.clientMutationId) {
      await this.mutationLedger.complete({
        clientMutationId: input.clientMutationId,
        userId: currentUser.sub,
        mutationType: 'approval.approve',
        entityType: 'request',
        entityId: requestId,
        dedupeKey: input.dedupeKey,
        response,
      });
    }

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'request',
      entityId: requestId,
      action: 'approval.approved',
      summary: `Approved ${request.type} request from ${request.createdBy.fullName}`,
      payload: {
        requestType: request.type,
      },
    });
    await this.syncPublisher.record([
      {
        domain: 'requests',
        entityType: 'request',
        entityId: requestId,
      },
      {
        domain: 'shifts',
        entityType: 'shift',
        entityId: request.shiftId,
      },
      {
        domain: request.type === 'leave' ? 'open-shifts' : 'shifts',
        entityType: request.type === 'leave' ? 'open_shift' : 'shift',
        entityId:
          request.type === 'leave'
            ? (derivedOpenShiftId ?? request.shiftId)
            : request.shiftId,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: requestId,
      },
    ]);

    return response;
  }

  async reject(
    currentUser: AuthenticatedUser,
    requestId: string,
    input: ReviewRequestDto,
  ) {
    const existing = await this.mutationLedger.findExisting({
      clientMutationId: input.clientMutationId,
      userId: currentUser.sub,
      mutationType: 'approval.reject',
      dedupeKey: input.dedupeKey,
    });

    if (existing?.response) {
      return existing.response;
    }

    const request = await this.prisma.request.findUnique({
      where: { id: requestId },
    });

    if (!request) {
      throw new NotFoundException('Khong tim thay yeu cau can tu choi.');
    }

    if (request.status !== 'pending') {
      throw this.buildAlreadyReviewedConflict(request.id);
    }

    const reviewNote = input.note?.trim() ?? null;

    await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.request.updateMany({
        where: {
          id: requestId,
          status: 'pending',
        },
        data: {
          status: 'rejected',
          managerNote: reviewNote,
        },
      });

      if (updateResult.count === 0) {
        throw this.buildAlreadyReviewedConflict(requestId);
      }

      await tx.approvalAction.create({
        data: {
          requestId,
          managerId: currentUser.sub,
          action: 'rejected',
          note: reviewNote,
        },
      });
    });

    await this.notificationsService.createNotification({
      userId: request.createdById,
      title: 'Yeu cau bi tu choi',
      body: 'Yeu cau cua ban can duoc dieu chinh va gui lai neu van can thiet.',
      type: 'request_rejected',
    });

    const response = {
      requestId,
      managerId: currentUser.sub,
      action: 'rejected' as const,
      managerNote: reviewNote ?? undefined,
      reviewedAt: new Date().toISOString(),
    };

    if (input.clientMutationId) {
      await this.mutationLedger.complete({
        clientMutationId: input.clientMutationId,
        userId: currentUser.sub,
        mutationType: 'approval.reject',
        entityType: 'request',
        entityId: requestId,
        dedupeKey: input.dedupeKey,
        response,
      });
    }

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'request',
      entityId: requestId,
      action: 'approval.rejected',
      summary: 'Rejected request after manager review',
    });
    await this.syncPublisher.record([
      {
        domain: 'requests',
        entityType: 'request',
        entityId: requestId,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: requestId,
      },
    ]);

    return response;
  }
}
