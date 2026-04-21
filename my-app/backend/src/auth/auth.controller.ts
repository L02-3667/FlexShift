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
import {
  ApiBearerAuth,
  ApiBody,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface';
import { UsersService } from '../users/users.service';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { LogoutDto } from './dto/logout.dto';
import { RefreshSessionDto } from './dto/refresh-session.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Đăng nhập và tạo phiên mới cho thiết bị hiện tại' })
  @ApiBody({ type: LoginDto })
  @ApiCreatedResponse({
    description: 'Đăng nhập thành công.',
    schema: {
      example: {
        accessToken: '<jwt-access-token>',
        refreshToken: '<jwt-refresh-token>',
        accessTokenExpiresAt: '2026-04-17T09:15:00.000Z',
        refreshTokenExpiresAt: '2026-04-24T09:00:00.000Z',
        user: {
          id: 'cm9m4n2n70000l5081l0a1abc',
          fullName: 'Lê Hoàng Quân',
          email: 'manager@flexshift.app',
          phone: '0901000001',
          role: 'manager',
          status: 'active',
        },
      },
    },
  })
  login(@Body() input: LoginDto, @Req() request: Request) {
    return this.authService.login(input, {
      ipAddress: request.ip,
      userAgent: request.header('user-agent') ?? undefined,
    });
  }

  @Post('refresh')
  @ApiOperation({ summary: 'Làm mới token từ refresh token hợp lệ' })
  @ApiBody({ type: RefreshSessionDto })
  @ApiCreatedResponse({
    description: 'Refresh thành công.',
    schema: {
      example: {
        accessToken: '<jwt-access-token>',
        refreshToken: '<jwt-refresh-token>',
        accessTokenExpiresAt: '2026-04-17T09:30:00.000Z',
        refreshTokenExpiresAt: '2026-04-24T09:15:00.000Z',
        user: {
          id: 'cm9m4n2n70000l5081l0a1abc',
          fullName: 'Lê Hoàng Quân',
          email: 'manager@flexshift.app',
          phone: '0901000001',
          role: 'manager',
          status: 'active',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Refresh token không hợp lệ.' })
  refresh(@Body() input: RefreshSessionDto, @Req() request: Request) {
    return this.authService.refresh(input.refreshToken, {
      deviceId: input.deviceId,
      ipAddress: request.ip,
      userAgent: request.header('user-agent') ?? undefined,
    });
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary:
      'Đăng xuất phiên hiện tại hoặc toàn bộ phiên của người dùng tùy payload',
  })
  @ApiBody({ type: LogoutDto })
  @ApiCreatedResponse({
    schema: {
      example: {
        success: true,
      },
    },
  })
  logout(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: LogoutDto,
  ) {
    return this.authService.logout(currentUser.sub, input.refreshToken);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Lấy hồ sơ người dùng hiện tại từ access token' })
  @ApiOkResponse({
    schema: {
      example: {
        id: 'cm9m4n2n70000l5081l0a1abc',
        fullName: 'Lê Hoàng Quân',
        email: 'manager@flexshift.app',
        phone: '0901000001',
        role: 'manager',
        status: 'active',
      },
    },
  })
  async me(@CurrentUser() currentUser: AuthenticatedUser) {
    const user = await this.usersService.findById(currentUser.sub);
    return user ? this.usersService.toMobileUser(user) : null;
  }

  @Patch('password')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cập nhật mật khẩu cho người dùng hiện tại' })
  @ApiBody({ type: UpdatePasswordDto })
  @ApiOkResponse({
    schema: {
      example: {
        success: true,
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Mật khẩu hiện tại không đúng hoặc session không hợp lệ.',
  })
  updatePassword(
    @CurrentUser() currentUser: AuthenticatedUser,
    @Body() input: UpdatePasswordDto,
  ) {
    return this.authService.updatePassword(currentUser.sub, input);
  }
}
