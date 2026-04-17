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
      message: 'Yêu cầu này đã được xử lý trước đó.',
      entityType: 'request',
      entityId: requestId,
      recoverable: true,
      retryable: false,
      resolution: 'Làm mới trang chi tiết yêu cầu để xem kết quả mới nhất.',
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
      throw new NotFoundException('Không tìm thấy yêu cầu cần duyệt.');
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
            note: `Ca phát sinh từ yêu cầu nghỉ: ${request.reason}`,
          },
        });
      });

      derivedOpenShiftId = reopenedOpenShift.id;
    } else {
      if (!request.targetUserId) {
        throw new BadRequestException('Yêu cầu nhường ca thiếu người nhận.');
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
          message: 'Người nhận ca đang có lịch trùng thời gian.',
          entityType: 'request',
          entityId: request.id,
          recoverable: true,
          retryable: false,
          resolution:
            'Chọn đồng nghiệp khác hoặc cập nhật lại yêu cầu nhường ca.',
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
      title: 'Yêu cầu đã được duyệt',
      body:
        request.type === 'leave'
          ? 'Đơn xin nghỉ của bạn đã được chấp thuận.'
          : 'Đề nghị nhường ca của bạn đã được chấp thuận.',
      type: 'request_approved',
    });

    if (request.type === 'yield' && request.targetUserId) {
      await this.notificationsService.createNotification({
        userId: request.targetUserId,
        title: 'Bạn vừa được giao ca',
        body: `${request.shift.position.name} tại ${request.shift.store.name} đã được chuyển sang lịch của bạn.`,
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
      throw new NotFoundException('Không tìm thấy yêu cầu cần từ chối.');
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
      title: 'Yêu cầu bị từ chối',
      body: 'Yêu cầu của bạn cần được điều chỉnh và gửi lại nếu vẫn cần thiết.',
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
