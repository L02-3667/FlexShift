import { AppEnv } from '@/src/config/env';
import { APP_CONFIG } from '@/src/constants/config';
import type { AuthSession } from '@/src/types/models';

import { ApiError, ApiUnauthorizedError } from './api-errors';
import {
  clearAuthSession,
  getSessionSnapshot,
  setAuthSession,
} from '../session/session-store';
import { getDeviceContext } from '../session/device-context';

interface RequestOptions extends Omit<RequestInit, 'body' | 'signal'> {
  auth?: boolean;
  body?: unknown;
  signal?: AbortSignal;
  timeoutMs?: number;
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

function isAbortError(error: unknown) {
  return (
    error instanceof Error &&
    (error.name === 'AbortError' ||
      error.message.toLowerCase().includes('aborted'))
  );
}

function createAbortSignal(timeoutMs: number, externalSignal?: AbortSignal) {
  const controller = new AbortController();
  const timeout = setTimeout(() => {
    controller.abort();
  }, timeoutMs);

  const handleExternalAbort = () => {
    controller.abort();
  };

  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', handleExternalAbort);
    }
  }

  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);

      if (externalSignal) {
        externalSignal.removeEventListener('abort', handleExternalAbort);
      }
    },
  };
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

  return new ApiError('Không thể kết nối máy chủ FlexShift.', response.status);
}

async function executeFetch(
  url: string,
  options: RequestOptions,
  accessToken?: string,
) {
  const {
    auth: _auth,
    body,
    timeoutMs,
    signal: externalSignal,
    ...init
  } = options;
  const timeoutBudget = timeoutMs ?? APP_CONFIG.apiRequestTimeoutMs;
  const requestSignal = createAbortSignal(timeoutBudget, externalSignal);

  try {
    return await fetch(url, {
      ...init,
      headers: buildHeaders(options, accessToken),
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: requestSignal.signal,
    });
  } catch (error) {
    if (isAbortError(error)) {
      throw new ApiError(
        'Máy chủ phản hồi quá lâu. Vui lòng thử lại.',
        408,
        'REQUEST_TIMEOUT',
      );
    }

    throw error;
  } finally {
    requestSignal.cleanup();
  }
}

async function refreshSession() {
  const snapshot = getSessionSnapshot();
  const refreshToken = snapshot.session?.refreshToken;

  if (!refreshToken) {
    await clearAuthSession();
    return null;
  }

  const deviceContext = await getDeviceContext();
  const response = await executeFetch(
    `${AppEnv.apiBaseUrl}/auth/refresh`,
    {
      method: 'POST',
      body: { refreshToken, deviceId: deviceContext.deviceId },
      timeoutMs: APP_CONFIG.apiRequestTimeoutMs,
    },
    undefined,
  );

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
  const response = await executeFetch(
    `${AppEnv.apiBaseUrl}${path}`,
    options,
    accessToken,
  );

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

export function resetApiClientStateForTests() {
  refreshPromise = null;
}
