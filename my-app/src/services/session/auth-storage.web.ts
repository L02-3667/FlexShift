const SESSION_STORAGE_KEY = 'flexshift.auth.session';

export async function readStoredSession() {
  if (typeof localStorage === 'undefined') {
    return null;
  }

  return localStorage.getItem(SESSION_STORAGE_KEY);
}

export async function writeStoredSession(value: string) {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.setItem(SESSION_STORAGE_KEY, value);
}

export async function clearStoredSession() {
  if (typeof localStorage === 'undefined') {
    return;
  }

  localStorage.removeItem(SESSION_STORAGE_KEY);
}
