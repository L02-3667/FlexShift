import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ActivityService } from './activity.service';

@Controller('activity')
@UseGuards(JwtAuthGuard)
export class ActivityController {
  constructor(private readonly activityService: ActivityService) {}

  @Get()
  list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query('limit') rawLimit?: string,
  ) {
    return this.activityService.list(
      currentUser,
      rawLimit ? Number(rawLimit) : 25,
    );
  }
}
