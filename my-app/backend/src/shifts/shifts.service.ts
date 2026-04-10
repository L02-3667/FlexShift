import { Injectable, NotFoundException } from '@nestjs/common';

import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../prisma/prisma.service';
import { QueryShiftsDto } from './dto/query-shifts.dto';

@Injectable()
export class ShiftsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(currentUser: AuthenticatedUser, query: QueryShiftsDto) {
    const where: Record<string, unknown> = {};

    if (query.status) {
      where.status = query.status;
    }

    if (query.from || query.to) {
      where.date = {
        ...(query.from ? { gte: new Date(`${query.from}T00:00:00.000Z`) } : {}),
        ...(query.to ? { lte: new Date(`${query.to}T23:59:59.999Z`) } : {}),
      };
    }

    if (currentUser.role === 'employee') {
      where.assignments = {
        some: {
          userId: currentUser.sub,
        },
      };
    } else if (query.userId) {
      where.assignments = {
        some: {
          userId: query.userId,
        },
      };
    }

    const shifts = await this.prisma.shift.findMany({
      where,
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

    return shifts.map((shift) => {
      const assignee = shift.assignments[0]?.user ?? null;

      return {
        id: shift.id,
        employeeId: assignee?.id ?? '',
        employeeName: assignee?.fullName ?? 'Chua xep',
        date: shift.date.toISOString().slice(0, 10),
        startTime: shift.startTime,
        endTime: shift.endTime,
        storeName: shift.store.name,
        position: shift.position.name,
        status: shift.status,
      };
    });
  }

  async findOne(id: string) {
    const shift = await this.prisma.shift.findUnique({
      where: { id },
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

    if (!shift) {
      throw new NotFoundException('Khong tim thay ca lam.');
    }

    const assignee = shift.assignments[0]?.user ?? null;

    return {
      id: shift.id,
      employeeId: assignee?.id ?? '',
      employeeName: assignee?.fullName ?? 'Chua xep',
      date: shift.date.toISOString().slice(0, 10),
      startTime: shift.startTime,
      endTime: shift.endTime,
      storeName: shift.store.name,
      position: shift.position.name,
      status: shift.status,
    };
  }
}
