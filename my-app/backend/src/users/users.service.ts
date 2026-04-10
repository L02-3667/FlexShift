import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async listEmployees() {
    return this.prisma.user.findMany({
      where: {
        role: 'employee',
        isActive: true,
      },
      orderBy: {
        fullName: 'asc',
      },
    });
  }

  async updatePassword(userId: string, passwordHash: string) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }

  toMobileUser(user: {
    id: string;
    fullName: string;
    email: string;
    phone: string | null;
    role: 'employee' | 'manager' | 'admin';
    isActive: boolean;
  }) {
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone ?? '',
      role: user.role === 'admin' ? 'manager' : user.role,
      status: user.isActive ? 'active' : 'inactive',
    };
  }
}
