import { Controller, Get, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ensureAllowedRole } from '../common/policies/role-policy';
import { StatisticsService } from './statistics.service';

@Controller('statistics')
@UseGuards(JwtAuthGuard)
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('employee')
  getEmployeeStatistics(@CurrentUser() currentUser: AuthenticatedUser) {
    ensureAllowedRole(currentUser, 'employee');
    return this.statisticsService.getEmployeeStatistics(currentUser);
  }

  @Get('manager')
  getManagerStatistics(@CurrentUser() currentUser: AuthenticatedUser) {
    ensureAllowedRole(currentUser, 'manager');
    return this.statisticsService.getManagerStatistics();
  }
}
