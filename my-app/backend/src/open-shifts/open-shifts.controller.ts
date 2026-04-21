import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ensureAllowedRole } from '../common/policies/role-policy';
import { ClaimOpenShiftDto } from './dto/claim-open-shift.dto';
import { CreateOpenShiftDto } from './dto/create-open-shift.dto';
import { OpenShiftsService } from './open-shifts.service';

@Controller('open-shifts')
@UseGuards(JwtAuthGuard)
export class OpenShiftsController {
  constructor(private readonly openShiftsService: OpenShiftsService) {}

  @Get()
  list() {
    return this.openShiftsService.list();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.openShiftsService.findOne(id);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateOpenShiftDto,
  ) {
    ensureAllowedRole(currentUser, 'manager');
    return this.openShiftsService.create(currentUser, input);
  }

  @Post(':id/claim')
  claim(
    @Param('id') id: string,
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: ClaimOpenShiftDto,
  ) {
    ensureAllowedRole(currentUser, 'employee');
    return this.openShiftsService.claim(id, currentUser, input);
  }
}
