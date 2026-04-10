import {
  Body,
  Controller,
  Get,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  login(@Body() input: LoginDto, @Req() request: Request) {
    return this.authService.login(input, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent') ?? undefined,
    });
  }

  @Post('refresh')
  refresh(@Body() input: RefreshSessionDto, @Req() request: Request) {
    return this.authService.refresh(input.refreshToken, {
      deviceId: input.deviceId,
      ipAddress: request.ip,
      userAgent: request.header('user-agent') ?? undefined,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: LogoutDto,
  ) {
    return this.authService.logout(currentUser.sub, input.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.sub);
    return user ? this.usersService.toMobileUser(user) : null;
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  updatePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(currentUser.sub, input);
  }
}
