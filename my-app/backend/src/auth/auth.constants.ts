import type { StringValue } from 'ms';

export const AUTH_TOKEN_POLICY = {
  accessTokenExpiresIn: '15m' as StringValue,
  refreshTokenExpiresIn: '7d' as StringValue,
  accessTokenLifetimeMs: 15 * 60 * 1000,
  refreshTokenLifetimeMs: 7 * 24 * 60 * 60 * 1000,
} as const;

export const UNKNOWN_DEVICE_CONTEXT = {
  deviceId: 'unknown-device',
  deviceName: 'Unknown device',
  platform: 'unknown',
} as const;
