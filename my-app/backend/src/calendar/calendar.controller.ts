import { Controller, Get, Query, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { CalendarService } from './calendar.service';
import { QueryCalendarDto } from './dto/query-calendar.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  @Get()
  getCalendar(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Query() query: QueryCalendarDto,
  ) {
    return this.calendarService.getCalendar(currentUser, query);
  }
}
