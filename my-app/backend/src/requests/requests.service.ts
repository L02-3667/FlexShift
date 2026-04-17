import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, RequestStatus } from '@prisma/client';

import { ActivityWriter } from '../activity/activity-writer';
import { canViewRequest } from '../common/policies/request-access.policy';
import { DomainConflictException } from '../common/exceptions/domain-conflict.exception';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { NotificationGateway } from '../notifications/notification-gateway';
import { PrismaService } from '../prisma/prisma.service';
import { MutationLedgerService } from '../sync/mutation-ledger.service';
import { SyncChangePublisher } from '../sync/sync-change-publisher';
import { mapRequestForMobile } from './request.mapper';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateYieldRequestDto } from './dto/create-yield-request.dto';
import { QueryRequestsDto } from './dto/query-requests.dto';

@Injectable()
export class RequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationGateway,
    private readonly mutationLedger: MutationLedgerService,
    private readonly syncPublisher: SyncChangePublisher,
    private readonly activityService: ActivityWriter,
  ) {}

  private async ensureShiftOwnership(shiftId: string, userId: string) {
    const shift = await this.prisma.shift.findFirst({
      where: {
        id: shiftId,
        assignments: {
          some: {
            userId,
          },
        },
      },
      include: {
        store: true,
        position: true,
      },
    });

    if (!shift) {
      throw new BadRequestException('Ca làm không hợp lệ cho yêu cầu này.');
    }

    return shift;
  }

  async list(currentUser: AuthenticatedUser, query: QueryRequestsDto) {
    const where: Prisma.RequestWhereInput = {};

    if (currentUser.role === 'employee') {
      where.createdById = currentUser.sub;
    }

    if (query.status) {
      where.status = query.status as RequestStatus;
    }

    const requests = await this.prisma.request.findMany({
      where,
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

    return requests.map((request) => mapRequestForMobile(request));
  }

  async findOne(currentUser: AuthenticatedUser, id: string) {
    const request = await this.prisma.request.findUnique({
      where: { id },
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
    });

    if (!request) {
      throw new NotFoundException('Không tìm thấy yêu cầu.');
    }

    if (
      !canViewRequest(currentUser.role, request.createdById, currentUser.sub)
    ) {
      throw new ForbiddenException('Bạn không được xem yêu cầu này.');
    }

    return mapRequestForMobile(request);
  }

  async createLeave(
    currentUser: AuthenticatedUser,
    input: CreateLeaveRequestDto,
  ) {
    const existing = await this.mutationLedger.findExisting({
      clientMutationId: input.clientMutationId,
      userId: currentUser.sub,
      mutationType: 'request.leave',
      dedupeKey: input.dedupeKey,
    });

    if (existing?.response) {
      return existing.response;
    }

    const shift = await this.ensureShiftOwnership(
      input.shiftId,
      currentUser.sub,
    );

    const pendingRequest = await this.prisma.request.findFirst({
      where: {
        shiftId: input.shiftId,
        createdById: currentUser.sub,
        status: 'pending',
      },
    });

    if (pendingRequest) {
      throw new DomainConflictException({
        code: 'DUPLICATE_PENDING_REQUEST',
        message: 'Bạn đã có một yêu cầu đang chờ duyệt cho ca này.',
        entityType: 'request',
        entityId: pendingRequest.id,
        recoverable: true,
        retryable: false,
        resolution: 'Mở danh sách yêu cầu để theo dõi trạng thái hiện tại.',
      });
    }

    const request = await this.prisma.request.create({
      data: {
        type: 'leave',
        shiftId: input.shiftId,
        createdById: currentUser.sub,
        reason: input.reason.trim(),
      },
      include: {
        shift: {
          include: {
            store: true,
            position: true,
          },
        },
        createdBy: true,
        targetUser: true,
        approvalActions: true,
      },
    });

    const managers = await this.prisma.user.findMany({
      where: {
        role: 'manager',
        isActive: true,
      },
    });

    await Promise.all(
      managers.map((manager) =>
        this.notificationsService.createNotification({
          userId: manager.id,
          title: 'Yêu cầu xin nghỉ mới',
          body: `${request.createdBy.fullName} vừa gửi yêu cầu nghỉ ca ${shift.position.name}.`,
          type: 'schedule_updated',
        }),
      ),
    );

    const response = mapRequestForMobile(request);

    if (input.clientMutationId) {
      await this.mutationLedger.complete({
        clientMutationId: input.clientMutationId,
        userId: currentUser.sub,
        mutationType: 'request.leave',
        entityType: 'request',
        entityId: request.id,
        dedupeKey: input.dedupeKey,
        response,
      });
    }

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'request',
      entityId: request.id,
      action: 'request.leave.created',
      summary: `Created leave request for ${shift.position.name}`,
      payload: {
        shiftId: input.shiftId,
      },
    });
    await this.syncPublisher.record([
      {
        domain: 'requests',
        entityType: 'request',
        entityId: request.id,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: request.id,
      },
    ]);

    return response;
  }

  async createYield(
    currentUser: AuthenticatedUser,
    input: CreateYieldRequestDto,
  ) {
    const existing = await this.mutationLedger.findExisting({
      clientMutationId: input.clientMutationId,
      userId: currentUser.sub,
      mutationType: 'request.yield',
      dedupeKey: input.dedupeKey,
    });

    if (existing?.response) {
      return existing.response;
    }

    const shift = await this.ensureShiftOwnership(
      input.shiftId,
      currentUser.sub,
    );

    if (input.targetEmployeeId === currentUser.sub) {
      throw new BadRequestException(
        'Bạn cần chọn một đồng nghiệp khác để nhận ca.',
      );
    }

    const targetUser = await this.prisma.user.findFirst({
      where: {
        id: input.targetEmployeeId,
        role: 'employee',
        isActive: true,
      },
    });

    if (!targetUser) {
      throw new NotFoundException('Không tìm thấy đồng nghiệp nhận ca.');
    }

    const pendingRequest = await this.prisma.request.findFirst({
      where: {
        shiftId: input.shiftId,
        createdById: currentUser.sub,
        status: 'pending',
      },
    });

    if (pendingRequest) {
      throw new DomainConflictException({
        code: 'DUPLICATE_PENDING_REQUEST',
        message: 'Bạn đã có một yêu cầu đang chờ duyệt cho ca này.',
        entityType: 'request',
        entityId: pendingRequest.id,
        recoverable: true,
        retryable: false,
        resolution: 'Mở danh sách yêu cầu để theo dõi trạng thái hiện tại.',
      });
    }

    const request = await this.prisma.request.create({
      data: {
        type: 'yield',
        shiftId: input.shiftId,
        createdById: currentUser.sub,
        targetUserId: input.targetEmployeeId,
        reason: input.reason.trim(),
      },
      include: {
        shift: {
          include: {
            store: true,
            position: true,
          },
        },
        createdBy: true,
        targetUser: true,
        approvalActions: true,
      },
    });

    const managers = await this.prisma.user.findMany({
      where: {
        role: 'manager',
        isActive: true,
      },
    });

    await Promise.all(
      managers.map((manager) =>
        this.notificationsService.createNotification({
          userId: manager.id,
          title: 'Đề nghị nhường ca mới',
          body: `${request.createdBy.fullName} muốn nhường ca ${shift.position.name}.`,
          type: 'schedule_updated',
        }),
      ),
    );

    const response = mapRequestForMobile(request);

    if (input.clientMutationId) {
      await this.mutationLedger.complete({
        clientMutationId: input.clientMutationId,
        userId: currentUser.sub,
        mutationType: 'request.yield',
        entityType: 'request',
        entityId: request.id,
        dedupeKey: input.dedupeKey,
        response,
      });
    }

    await this.activityService.record({
      actorUserId: currentUser.sub,
      sessionId: currentUser.sessionId,
      deviceId: currentUser.deviceId,
      entityType: 'request',
      entityId: request.id,
      action: 'request.yield.created',
      summary: `Created yield request for ${shift.position.name}`,
      payload: {
        shiftId: input.shiftId,
        targetEmployeeId: input.targetEmployeeId,
      },
    });
    await this.syncPublisher.record([
      {
        domain: 'requests',
        entityType: 'request',
        entityId: request.id,
      },
      {
        domain: 'activity',
        entityType: 'audit_log',
        entityId: request.id,
      },
    ]);

    return response;
  }
}
