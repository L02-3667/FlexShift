import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { createId } from '@/src/utils/id';

const DEVICE_STORAGE_KEY = 'flexshift.device.id';

interface DeviceContext {
  deviceId: string;
  deviceName: string;
  platform: string;
  appVersion: string;
}

let cachedDeviceContext: DeviceContext | null = null;

async function readStoredDeviceId() {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(DEVICE_STORAGE_KEY);
  }

  return SecureStore.getItemAsync(DEVICE_STORAGE_KEY);
}

async function writeStoredDeviceId(deviceId: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(DEVICE_STORAGE_KEY, deviceId);
    return;
  }

  await SecureStore.setItemAsync(DEVICE_STORAGE_KEY, deviceId);
}

export async function getDeviceContext() {
  if (cachedDeviceContext) {
    return cachedDeviceContext;
  }

  let deviceId = await readStoredDeviceId();

  if (!deviceId) {
    deviceId = createId('device');
    await writeStoredDeviceId(deviceId);
  }

  cachedDeviceContext = {
    deviceId,
    deviceName: Constants.deviceName ?? `${Platform.OS} frontline device`,
    platform: Platform.OS,
    appVersion: Constants.expoConfig?.version ?? 'dev',
  };

  return cachedDeviceContext;
}
