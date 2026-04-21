import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ensureAllowedRole } from '../common/policies/role-policy';
import { ApprovalsService } from './approvals.service';
import { ReviewRequestDto } from './dto/review-request.dto';

@Controller('approvals')
@UseGuards(JwtAuthGuard)
export class ApprovalsController {
  constructor(private readonly approvalsService: ApprovalsService) {}

  @Post(':id/approve')
  approve(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: ReviewRequestDto,
  ) {
    ensureAllowedRole(currentUser, 'manager');
    return this.approvalsService.approve(currentUser, id, input);
  }

  @Post(':id/reject')
  reject(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
    @Body() input: ReviewRequestDto,
  ) {
    ensureAllowedRole(currentUser, 'manager');
    return this.approvalsService.reject(currentUser, id, input);
  }
}
