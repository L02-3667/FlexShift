import { Controller, Get, Param, Post, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  list(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.sessionsService.listSessions(
      currentUser.sub,
      currentUser.sessionId,
    );
  }

  @Post(':id/revoke')
  revoke(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.sessionsService.revokeOwnedSession(currentUser.sub, id);
  }
}
