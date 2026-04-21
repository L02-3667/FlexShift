import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHash, randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';

import { UNKNOWN_DEVICE_CONTEXT } from '../auth/auth.constants';
import { PrismaService } from '../prisma/prisma.service';

interface SessionMetadata {
  deviceId?: string;
  deviceName?: string;
  platform?: string;
  appVersion?: string;
  ipAddress?: string;
  userAgent?: string;
}

function createRefreshTokenFingerprint(refreshToken: string) {
  return createHash('sha256').update(refreshToken).digest('hex');
}

@Injectable()
export class SessionsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSessionShell(
    userId: string,
    expiresAt: Date,
    metadata: SessionMetadata = {},
  ) {
    return this.prisma.session.create({
      data: {
        userId,
        refreshToken: 'pending',
        refreshTokenFingerprint: `pending-${randomUUID()}`,
        deviceId: metadata.deviceId ?? UNKNOWN_DEVICE_CONTEXT.deviceId,
        deviceName: metadata.deviceName ?? UNKNOWN_DEVICE_CONTEXT.deviceName,
        platform: metadata.platform ?? UNKNOWN_DEVICE_CONTEXT.platform,
        appVersion: metadata.appVersion,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        expiresAt,
        lastSeenAt: new Date(),
      },
    });
  }

  async rotateRefreshToken(
    sessionId: string,
    refreshToken: string,
    expiresAt: Date,
  ) {
    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);

    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        refreshToken: refreshTokenHash,
        refreshTokenFingerprint: createRefreshTokenFingerprint(refreshToken),
        expiresAt,
        lastSeenAt: new Date(),
      },
    });
  }

  async findValidSession(refreshToken: string) {
    const session = await this.prisma.session.findUnique({
      where: {
        refreshTokenFingerprint: createRefreshTokenFingerprint(refreshToken),
      },
    });

    if (!session || session.revokedAt || session.expiresAt <= new Date()) {
      return null;
    }

    const matches = await bcrypt.compare(refreshToken, session.refreshToken);

    if (!matches) {
      return null;
    }

    return session;
  }

  findActiveSessionById(sessionId: string) {
    return this.prisma.session.findFirst({
      where: {
        id: sessionId,
        revokedAt: null,
        expiresAt: {
          gt: new Date(),
        },
      },
    });
  }

  async touchSession(sessionId: string, metadata: SessionMetadata = {}) {
    return this.prisma.session.update({
      where: { id: sessionId },
      data: {
        lastSeenAt: new Date(),
        deviceName: metadata.deviceName,
        appVersion: metadata.appVersion,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
      },
    });
  }

  async revokeSession(id: string, reason = 'rotated') {
    return this.prisma.session.update({
      where: { id },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async revokeOwnedSession(userId: string, sessionId: string) {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.userId !== userId) {
      throw new ForbiddenException('Ban khong the thu hoi session nay.');
    }

    await this.revokeSession(sessionId, 'revoked_by_user');
    return { success: true };
  }

  async revokeByUser(userId: string, reason = 'logout_all') {
    return this.prisma.session.updateMany({
      where: {
        userId,
        revokedAt: null,
      },
      data: {
        revokedAt: new Date(),
        revokedReason: reason,
      },
    });
  }

  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: {
        userId,
      },
      orderBy: {
        lastSeenAt: 'desc',
      },
    });

    return sessions.map((session) => ({
      id: session.id,
      deviceId: session.deviceId,
      deviceName: session.deviceName,
      platform: session.platform,
      appVersion: session.appVersion,
      lastSeenAt: session.lastSeenAt.toISOString(),
      expiresAt: session.expiresAt.toISOString(),
      revokedAt: session.revokedAt?.toISOString() ?? null,
      isCurrent: currentSessionId ? session.id === currentSessionId : false,
    }));
  }
}
