import { AppEnv } from '@/src/config/env';
import type { AuthSession } from '@/src/types/models';

import { ApiError, ApiUnauthorizedError } from './api-errors';
import {
  clearAuthSession,
  getSessionSnapshot,
  setAuthSession,
} from '../session/session-store';
import { getDeviceContext } from '../session/device-context';

interface RequestOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean;
  body?: unknown;
}

let refreshPromise: Promise<AuthSession | null> | null = null;

function buildHeaders(options: RequestOptions, accessToken?: string) {
  const headers = new Headers(options.headers ?? {});

  if (options.body !== undefined) {
    headers.set('Content-Type', 'application/json');
  }

  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  return headers;
}

async function parseError(response: Response) {
  let payload: unknown;

  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (typeof payload === 'object' && payload && 'message' in payload) {
    const message = Array.isArray(payload.message)
      ? payload.message.join(', ')
      : String(payload.message);
    const code =
      'code' in payload && typeof payload.code === 'string'
        ? payload.code
        : undefined;

    if (response.status === 401) {
      return new ApiUnauthorizedError(message);
    }

    return new ApiError(message, response.status, code);
  }

  if (response.status === 401) {
    return new ApiUnauthorizedError();
  }

  return new ApiError('Khong the ket noi may chu FlexShift.', response.status);
}

async function refreshSession() {
  const snapshot = getSessionSnapshot();
  const refreshToken = snapshot.session?.refreshToken;

  if (!refreshToken) {
    await clearAuthSession();
    return null;
  }

  const deviceContext = await getDeviceContext();

  const response = await fetch(`${AppEnv.apiBaseUrl}/auth/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ refreshToken, deviceId: deviceContext.deviceId }),
  });

  if (!response.ok) {
    await clearAuthSession();
    throw await parseError(response);
  }

  const session = (await response.json()) as AuthSession;
  await setAuthSession(session);
  return session;
}

async function ensureRefreshedSession() {
  if (!refreshPromise) {
    refreshPromise = refreshSession().finally(() => {
      refreshPromise = null;
    });
  }

  return refreshPromise;
}

async function executeRequest<T>(
  path: string,
  options: RequestOptions,
  accessToken?: string,
) {
  const response = await fetch(`${AppEnv.apiBaseUrl}${path}`, {
    ...options,
    headers: buildHeaders(options, accessToken),
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  if (!response.ok) {
    throw await parseError(response);
  }

  return (await response.json()) as T;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
) {
  const requiresAuth = options.auth !== false;
  const snapshot = getSessionSnapshot();
  const accessToken = requiresAuth ? snapshot.session?.accessToken : undefined;

  try {
    return await executeRequest<T>(path, options, accessToken);
  } catch (error) {
    if (!(error instanceof ApiUnauthorizedError) || !requiresAuth) {
      throw error;
    }

    const refreshedSession = await ensureRefreshedSession();

    if (!refreshedSession?.accessToken) {
      throw error;
    }

    return executeRequest<T>(path, options, refreshedSession.accessToken);
  }
}
