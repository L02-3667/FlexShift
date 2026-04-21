import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CreateLeaveRequestDto } from './dto/create-leave-request.dto';
import { CreateYieldRequestDto } from './dto/create-yield-request.dto';
import { QueryRequestsDto } from './dto/query-requests.dto';
import { RequestsService } from './requests.service';

@Controller('requests')
@UseGuards(JwtAuthGuard)
export class RequestsController {
  constructor(private readonly requestsService: RequestsService) {}

  @Get()
  list(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QueryRequestsDto,
  ) {
    return this.requestsService.list(currentUser, query);
  }

  @Get(':id')
  findOne(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Param('id') id: string,
  ) {
    return this.requestsService.findOne(currentUser, id);
  }

  @Post('leave')
  createLeave(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateLeaveRequestDto,
  ) {
    return this.requestsService.createLeave(currentUser, input);
  }

  @Post('yield')
  createYield(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: CreateYieldRequestDto,
  ) {
    return this.requestsService.createYield(currentUser, input);
  }
}
