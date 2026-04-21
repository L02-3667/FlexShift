import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UpdateUserSettingDto } from './dto/update-user-setting.dto';
import { SettingsService } from './settings.service';

@Controller('settings')
@UseGuards(JwtAuthGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('me')
  getMine(@CurrentUser() currentUser: AuthenticatedUser) {
    return this.settingsService.getForUser(currentUser.sub);
  }

  @Patch('me')
  updateMine(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: UpdateUserSettingDto,
  ) {
    return this.settingsService.updateForUser(currentUser.sub, input);
  }
}
