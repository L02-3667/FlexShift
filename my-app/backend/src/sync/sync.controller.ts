import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { QuerySyncDto } from './dto/query-sync.dto';
import { SyncService } from './sync.service';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private readonly syncService: SyncService) {}

  @Get('pull')
  pull(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QuerySyncDto,
  ) {
    return this.syncService.pull(currentUser, query);
  }
}
