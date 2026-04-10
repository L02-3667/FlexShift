import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { Session, UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';

import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';
import { AUTH_TOKEN_POLICY, UNKNOWN_DEVICE_CONTEXT } from './auth.constants';
import { LoginDto } from './dto/login.dto';
import { UpdatePasswordDto } from './dto/update-password.dto';

interface SessionContext {
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  ipAddress?: string;
  userAgent?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {}

  private getAccessTokenExpiresIn() {
    return AUTH_TOKEN_POLICY.accessTokenExpiresIn;
  }

  private getRefreshTokenExpiresIn() {
    return AUTH_TOKEN_POLICY.refreshTokenExpiresIn;
  }

  private async signTokens(
    user: {
      id: string;
      email: string;
      role: UserRole;
    },
    session: Pick<Session, 'id' | 'deviceId'>,
  ) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
      deviceId: session.deviceId,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(
        'JWT_ACCESS_SECRET',
        'flexshift-access-secret',
      ),
      expiresIn: this.getAccessTokenExpiresIn(),
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.get<string>(
        'JWT_REFRESH_SECRET',
        'flexshift-refresh-secret',
      ),
      expiresIn: this.getRefreshTokenExpiresIn(),
    });

    const accessTokenExpiresAt = new Date(
      Date.now() + AUTH_TOKEN_POLICY.accessTokenLifetimeMs,
    ).toISOString();
    const refreshTokenExpiresAt = new Date(
      Date.now() + AUTH_TOKEN_POLICY.refreshTokenLifetimeMs,
    ).toISOString();

    return {
      accessToken,
      refreshToken,
      accessTokenExpiresAt,
      refreshTokenExpiresAt,
    };
  }

  private normalizeSessionContext(context: SessionContext = {}) {
    return {
      deviceId: context.deviceId ?? UNKNOWN_DEVICE_CONTEXT.deviceId,
      deviceName: context.deviceName ?? UNKNOWN_DEVICE_CONTEXT.deviceName,
      platform: context.platform ?? UNKNOWN_DEVICE_CONTEXT.platform,
      appVersion: context.appVersion,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    };
  }

  async login(input: LoginDto, context: SessionContext = {}) {
    const user = await this.usersService.findByEmail(
      input.email.toLowerCase().trim(),
    );

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Email hoac mat khau khong dung.');
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new UnauthorizedException('Email hoac mat khau khong dung.');
    }

    const sessionContext = this.normalizeSessionContext({
      deviceId: input.deviceId ?? context.deviceId,
      deviceName: input.deviceName ?? context.deviceName,
      platform: input.platform ?? context.platform,
      appVersion: input.appVersion ?? context.appVersion,
      ipAddress: context.ipAddress,
      userAgent: context.userAgent,
    });
    const session = await this.sessionsService.createSessionShell(
      user.id,
      new Date(Date.now() + AUTH_TOKEN_POLICY.refreshTokenLifetimeMs),
      sessionContext,
    );
    const responseTokens = await this.signTokens(user, session);
    await this.sessionsService.rotateRefreshToken(
      session.id,
      responseTokens.refreshToken,
      new Date(responseTokens.refreshTokenExpiresAt),
    );

    return {
      ...responseTokens,
      user: this.usersService.toMobileUser(user),
    };
  }

  async refresh(refreshToken: string, context: SessionContext = {}) {
    const session = await this.sessionsService.findValidSession(refreshToken);

    if (!session) {
      throw new UnauthorizedException('Phien dang nhap khong con hop le.');
    }

    const user = await this.usersService.findById(session.userId);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tai khoan khong con hop le.');
    }

    await this.sessionsService.revokeSession(session.id, 'refresh_rotation');

    const refreshedSession = await this.sessionsService.createSessionShell(
      user.id,
      new Date(Date.now() + AUTH_TOKEN_POLICY.refreshTokenLifetimeMs),
      {
        deviceId: context.deviceId ?? session.deviceId,
        deviceName: session.deviceName,
        platform: session.platform,
        appVersion: session.appVersion ?? undefined,
        ipAddress: context.ipAddress,
        userAgent: context.userAgent,
      },
    );
    const activeTokens = await this.signTokens(user, refreshedSession);
    await this.sessionsService.rotateRefreshToken(
      refreshedSession.id,
      activeTokens.refreshToken,
      new Date(activeTokens.refreshTokenExpiresAt),
    );

    return {
      ...activeTokens,
      user: this.usersService.toMobileUser(user),
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      const session = await this.sessionsService.findValidSession(refreshToken);

      if (session && session.userId === userId) {
        await this.sessionsService.revokeSession(session.id, 'logout');
        return { success: true };
      }
    }

    await this.sessionsService.revokeByUser(userId, 'logout_all');
    return { success: true };
  }

  async updatePassword(userId: string, input: UpdatePasswordDto) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new UnauthorizedException('Tai khoan khong ton tai.');
    }

    const matches = await bcrypt.compare(
      input.currentPassword,
      user.passwordHash,
    );

    if (!matches) {
      throw new UnauthorizedException('Mat khau hien tai khong dung.');
    }

    const passwordHash = await bcrypt.hash(input.nextPassword, 10);
    await this.usersService.updatePassword(userId, passwordHash);

    return { success: true };
  }
}
