import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { ensureAllowedRole } from '../common/policies/role-policy';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';

@Controller('announcements')
@UseGuards(JwtAuthGuard)
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.announcementsService.list(currentUser);
  }

  @Post()
  create(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateAnnouncementDto,
  ) {
    ensureAllowedRole(currentUser, 'manager', 'admin');
    return this.announcementsService.create(currentUser, input);
  }

  @Post(':id/ack')
  acknowledge(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.announcementsService.acknowledge(currentUser, id);
  }
}
