import { Controller, Get } from '@nestjs/common';

import { HealthService } from './health.service';

@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  async getSummary() {
    return this.healthService.getSummary();
  }

  @Get('liveness')
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('readiness')
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
