import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const SESSION_STORAGE_KEY = 'flexshift.auth.session';

export async function readStoredSession() {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return null;
    }

    return localStorage.getItem(SESSION_STORAGE_KEY);
  }

  const rawValue = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  return rawValue ? rawValue : null;
}

export async function writeStoredSession(value: string) {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.setItem(SESSION_STORAGE_KEY, value);
    return;
  }

  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
}

export async function clearStoredSession() {
  if (Platform.OS === 'web') {
    if (typeof localStorage === 'undefined') {
      return;
    }

    localStorage.removeItem(SESSION_STORAGE_KEY);
    return;
  }

  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
