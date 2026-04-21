import * as SecureStore from 'expo-secure-store';

const SESSION_STORAGE_KEY = 'flexshift.auth.session';

export async function readStoredSession() {
  const rawValue = await SecureStore.getItemAsync(SESSION_STORAGE_KEY);
  return rawValue ? rawValue : null;
}

export async function writeStoredSession(value: string) {
  await SecureStore.setItemAsync(SESSION_STORAGE_KEY, value);
}

export async function clearStoredSession() {
  await SecureStore.deleteItemAsync(SESSION_STORAGE_KEY);
}
