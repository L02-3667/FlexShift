import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}

  getLiveness() {
    return {
      service: 'flexshift-backend',
      status: 'alive',
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    await this.prisma.checkReadiness();

    return {
      service: 'flexshift-backend',
      status: 'ready',
      database: 'up',
      timestamp: new Date().toISOString(),
    };
  }

  async getSummary() {
    const readiness = await this.getReadiness();

    return {
      ...readiness,
      liveness: 'alive',
    };
  }
}
