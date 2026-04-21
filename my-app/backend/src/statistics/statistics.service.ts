import { Injectable } from '@nestjs/common';

import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StatisticsService {
  constructor(private readonly prisma: PrismaService) {}

  private getCurrentWeekRange() {
    const now = new Date();
    const start = new Date(now);
    const day = start.getUTCDay();
    const diff = day === 0 ? -6 : 1 - day;
    start.setUTCDate(start.getUTCDate() + diff);
    start.setUTCHours(0, 0, 0, 0);

    const end = new Date(start);
    end.setUTCDate(end.getUTCDate() + 6);
    end.setUTCHours(23, 59, 59, 999);

    return { start, end };
  }

  private getCurrentMonthRange() {
    const now = new Date();
    const start = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1),
    );
    const end = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 0, 23, 59, 59, 999),
    );

    return { start, end };
  }

  private getDurationHours(startTime: string, endTime: string) {
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    return (endHours * 60 + endMinutes - (startHours * 60 + startMinutes)) / 60;
  }

  async getEmployeeStatistics(currentUser: AuthenticatedUser) {
    const week = this.getCurrentWeekRange();
    const month = this.getCurrentMonthRange();

    const [weekAssignments, monthAssignments, requests, completedAssignments] =
      await Promise.all([
        this.prisma.shiftAssignment.findMany({
          where: {
            userId: currentUser.sub,
            shift: {
              date: { gte: week.start, lte: week.end },
              status: 'scheduled',
            },
          },
          include: { shift: true },
        }),
        this.prisma.shiftAssignment.findMany({
          where: {
            userId: currentUser.sub,
            shift: {
              date: { gte: month.start, lte: month.end },
              status: 'scheduled',
            },
          },
          include: { shift: true },
        }),
        this.prisma.request.findMany({
          where: { createdById: currentUser.sub },
        }),
        this.prisma.shiftAssignment.findMany({
          where: {
            userId: currentUser.sub,
            shift: { status: 'completed' },
          },
        }),
      ]);

    const resolvedRequests = requests.filter(
      (request) => request.status !== 'pending',
    );
    const approvedRequests = resolvedRequests.filter(
      (request) => request.status === 'approved',
    );

    return {
      shiftCountThisWeek: weekAssignments.length,
      hoursThisWeek: weekAssignments.reduce(
        (total, assignment) =>
          total +
          this.getDurationHours(
            assignment.shift.startTime,
            assignment.shift.endTime,
          ),
        0,
      ),
      hoursThisMonth: monthAssignments.reduce(
        (total, assignment) =>
          total +
          this.getDurationHours(
            assignment.shift.startTime,
            assignment.shift.endTime,
          ),
        0,
      ),
      pendingRequestCount: requests.filter(
        (request) => request.status === 'pending',
      ).length,
      completedShiftCount: completedAssignments.length,
      approvalRate:
        resolvedRequests.length > 0
          ? Math.round(
              (approvedRequests.length / resolvedRequests.length) * 100,
            )
          : 0,
    };
  }

  async getManagerStatistics() {
    const week = this.getCurrentWeekRange();

    const [
      openShifts,
      pendingRequests,
      confirmedShifts,
      requests,
      weeklyShifts,
      stores,
    ] = await Promise.all([
      this.prisma.openShift.count({
        where: { status: 'open' },
      }),
      this.prisma.request.count({
        where: { status: 'pending' },
      }),
      this.prisma.shift.count({
        where: { status: 'scheduled' },
      }),
      this.prisma.request.findMany(),
      this.prisma.shift.findMany({
        where: {
          status: 'scheduled',
          date: {
            gte: week.start,
            lte: week.end,
          },
        },
      }),
      this.prisma.store.findMany({
        include: {
          shifts: true,
          openShifts: true,
        },
      }),
    ]);

    const denominator = confirmedShifts + openShifts;

    return {
      openShiftCount: openShifts,
      pendingRequestCount: pendingRequests,
      fillRate:
        denominator > 0
          ? Math.round((confirmedShifts / denominator) * 100)
          : 100,
      confirmedShiftCount: confirmedShifts,
      approvedRequestCount: requests.filter(
        (request) => request.status === 'approved',
      ).length,
      rejectedRequestCount: requests.filter(
        (request) => request.status === 'rejected',
      ).length,
      allocatedHoursThisWeek: weeklyShifts.reduce(
        (total, shift) =>
          total + this.getDurationHours(shift.startTime, shift.endTime),
        0,
      ),
      storeBreakdown: stores.map((store) => ({
        storeName: store.name,
        confirmedShiftCount: store.shifts.filter(
          (shift) => shift.status === 'scheduled',
        ).length,
        openShiftCount: store.openShifts.filter(
          (shift) => shift.status === 'open',
        ).length,
      })),
    };
  }
}
