import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';

import { HealthService } from './health.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  @Get()
  @ApiOperation({ summary: 'Tóm tắt health, gồm readiness và liveness' })
  @ApiOkResponse({
    schema: {
      example: {
        service: 'flexshift-backend',
        status: 'ready',
        database: 'up',
        liveness: 'alive',
        timestamp: '2026-04-17T09:00:00.000Z',
      },
    },
  })
  async getSummary() {
    return this.healthService.getSummary();
  }

  @Get('liveness')
  @ApiOperation({ summary: 'Kiểm tra tiến trình backend còn sống' })
  getLiveness() {
    return this.healthService.getLiveness();
  }

  @Get('readiness')
  @ApiOperation({ summary: 'Kiểm tra backend sẵn sàng phục vụ và kết nối DB' })
  async getReadiness() {
    return this.healthService.getReadiness();
  }
}
