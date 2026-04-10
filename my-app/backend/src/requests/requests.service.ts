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
      throw new BadRequestException('Ca lam khong hop le cho yeu cau nay.');
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
      throw new NotFoundException('Khong tim thay yeu cau.');
    }

    if (
      !canViewRequest(currentUser.role, request.createdById, currentUser.sub)
    ) {
      throw new ForbiddenException('Ban khong duoc xem yeu cau nay.');
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
        message: 'Ban da co mot yeu cau dang cho duyet cho ca nay.',
        entityType: 'request',
        entityId: pendingRequest.id,
        recoverable: true,
        retryable: false,
        resolution: 'Mo danh sach yeu cau de theo doi trang thai hien tai.',
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
          title: 'Yeu cau xin nghi moi',
          body: `${request.createdBy.fullName} vua gui yeu cau nghi ca ${shift.position.name}.`,
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
        'Ban can chon mot dong nghiep khac de nhan ca.',
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
      throw new NotFoundException('Khong tim thay dong nghiep nhan ca.');
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
        message: 'Ban da co mot yeu cau dang cho duyet cho ca nay.',
        entityType: 'request',
        entityId: pendingRequest.id,
        recoverable: true,
        retryable: false,
        resolution: 'Mo danh sach yeu cau de theo doi trang thai hien tai.',
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
          title: 'De nghi nhuong ca moi',
          body: `${request.createdBy.fullName} muon nhuong ca ${shift.position.name}.`,
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
