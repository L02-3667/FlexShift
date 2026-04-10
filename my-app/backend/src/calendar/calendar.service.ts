import { Injectable } from '@nestjs/common';

import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { QueryCalendarDto } from './dto/query-calendar.dto';

@Injectable()
export class CalendarService {
  constructor(private readonly prisma: PrismaService) {}

  async getCalendar(currentUser: AuthenticatedUser, query: QueryCalendarDto) {
    const from = query.from
      ? new Date(`${query.from}T00:00:00.000Z`)
      : new Date();
    const to = query.to
      ? new Date(`${query.to}T23:59:59.999Z`)
      : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const shiftWhere =
      currentUser.role === 'employee'
        ? {
            date: { gte: from, lte: to },
            assignments: {
              some: {
                userId: currentUser.sub,
              },
            },
          }
        : {
            date: { gte: from, lte: to },
          };

    const requestWhere =
      currentUser.role === 'employee'
        ? {
            createdById: currentUser.sub,
            shift: {
              date: { gte: from, lte: to },
            },
          }
        : {
            shift: {
              date: { gte: from, lte: to },
            },
          };

    const [shifts, openShifts, requests] = await Promise.all([
      this.prisma.shift.findMany({
        where: shiftWhere,
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
      }),
      this.prisma.openShift.findMany({
        where: {
          date: { gte: from, lte: to },
        },
        include: {
          store: true,
          position: true,
        },
        orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      }),
      this.prisma.request.findMany({
        where: requestWhere,
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
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      shifts: shifts.map((shift) => ({
        id: shift.id,
        employeeId: shift.assignments[0]?.userId ?? '',
        employeeName: shift.assignments[0]?.user.fullName ?? 'Chua xep',
        date: shift.date.toISOString().slice(0, 10),
        startTime: shift.startTime,
        endTime: shift.endTime,
        storeName: shift.store.name,
        position: shift.position.name,
        status: shift.status,
      })),
      openShifts: openShifts.map((shift) => ({
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
      })),
      requests: requests.map((request) => ({
        id: request.id,
        type: request.type,
        createdByEmployeeId: request.createdById,
        shiftId: request.shiftId,
        targetEmployeeId: request.targetUserId,
        reason: request.reason,
        status: request.status,
        managerNote: request.managerNote,
        createdAt: request.createdAt.toISOString(),
        reviewedAt:
          request.approvalActions[0]?.createdAt?.toISOString() ?? null,
        createdByEmployeeName: request.createdBy.fullName,
        targetEmployeeName: request.targetUser?.fullName ?? null,
        shiftDate: request.shift.date.toISOString().slice(0, 10),
        shiftStartTime: request.shift.startTime,
        shiftEndTime: request.shift.endTime,
        shiftStoreName: request.shift.store.name,
        shiftPosition: request.shift.position.name,
      })),
    };
  }
}
