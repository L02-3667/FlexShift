import type { AuthSession, SessionStatus } from '@/src/types/models';

import {
  clearStoredSession,
  readStoredSession,
  writeStoredSession,
} from './auth-storage';

interface SessionSnapshot {
  session: AuthSession | null;
  status: SessionStatus;
}

type SessionListener = (snapshot: SessionSnapshot) => void;

let currentSession: AuthSession | null = null;
let currentStatus: SessionStatus = 'idle';
const listeners = new Set<SessionListener>();

function emitSessionChange() {
  const snapshot = getSessionSnapshot();
  listeners.forEach((listener) => listener(snapshot));
}

export function getSessionSnapshot(): SessionSnapshot {
  return {
    session: currentSession,
    status: currentStatus,
  };
}

export function subscribeSession(listener: SessionListener) {
  listeners.add(listener);
  listener(getSessionSnapshot());

  return () => {
    listeners.delete(listener);
  };
}

export async function restoreSessionSnapshot() {
  currentStatus = 'restoring';
  emitSessionChange();

  const rawValue = await readStoredSession();

  if (!rawValue) {
    currentSession = null;
    currentStatus = 'unauthenticated';
    emitSessionChange();
    return getSessionSnapshot();
  }

  try {
    currentSession = JSON.parse(rawValue) as AuthSession;
    currentStatus = 'authenticated';
  } catch {
    currentSession = null;
    currentStatus = 'unauthenticated';
    await clearStoredSession();
  }

  emitSessionChange();
  return getSessionSnapshot();
}

export async function setAuthSession(
  session: AuthSession | null,
  status: SessionStatus = 'authenticated',
) {
  currentSession = session;
  currentStatus = session ? status : 'unauthenticated';

  if (session) {
    await writeStoredSession(JSON.stringify(session));
  } else {
    await clearStoredSession();
  }

  emitSessionChange();
  return getSessionSnapshot();
}

export async function clearAuthSession() {
  return setAuthSession(null, 'unauthenticated');
}
