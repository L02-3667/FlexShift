import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

import { SessionsService } from '../sessions/sessions.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    role: 'employee' | 'manager' | 'admin';
    sessionId?: string;
    deviceId?: string;
  }) {
    const user = await this.usersService.findById(payload.sub);

    if (!user || !user.isActive) {
      throw new UnauthorizedException('Tài khoản không còn hợp lệ.');
    }

    if (!payload.sessionId) {
      throw new UnauthorizedException('Session không hợp lệ.');
    }

    const session = await this.sessionsService.findActiveSessionById(
      payload.sessionId,
    );

    if (!session || session.userId !== user.id) {
      throw new UnauthorizedException('Session đã hết hạn hoặc bị thu hồi.');
    }

    if (payload.deviceId && session.deviceId !== payload.deviceId) {
      throw new UnauthorizedException('Thiết bị session không hợp lệ.');
    }

    await this.sessionsService.touchSession(session.id, {
      deviceName: session.deviceName,
      appVersion: session.appVersion ?? undefined,
    });

    return {
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: payload.sessionId,
      deviceId: payload.deviceId,
    };
  }
}
