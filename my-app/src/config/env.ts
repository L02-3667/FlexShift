import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { APP_CONFIG } from '@/src/constants/config';

interface ExpoExtraConfig {
  apiBaseUrl?: string;
}

const expoExtra = (Constants.expoConfig?.extra ?? {}) as ExpoExtraConfig;

function parsePositiveNumber(rawValue: string | undefined, fallback: number) {
  const parsed = Number(rawValue ?? fallback);

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function getFallbackApiBaseUrl() {
  const port =
    process.env.EXPO_PUBLIC_API_PORT ?? APP_CONFIG.defaultBackendPort;

  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${port}/api`;
  }

  return `http://127.0.0.1:${port}/api`;
}

export const AppEnv = {
  apiBaseUrl:
    process.env.EXPO_PUBLIC_API_BASE_URL ??
    expoExtra.apiBaseUrl ??
    getFallbackApiBaseUrl(),
  syncPollIntervalMs: parsePositiveNumber(
    process.env.EXPO_PUBLIC_SYNC_INTERVAL_MS,
    APP_CONFIG.syncPollIntervalMs,
  ),
};
