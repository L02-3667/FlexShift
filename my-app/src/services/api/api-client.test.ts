import type { AuthSession } from '@/src/types/models';

import {
  apiRequest,
  resetApiClientStateForTests,
} from '@/src/services/api/api-client';

const mockClearAuthSession = jest.fn().mockResolvedValue(undefined);
const mockGetSessionSnapshot = jest.fn();
const mockSetAuthSession = jest.fn().mockResolvedValue(undefined);
const mockGetDeviceContext = jest.fn().mockResolvedValue({
  deviceId: 'device-1',
});

jest.mock('@/src/services/session/session-store', () => ({
  clearAuthSession: (...args: unknown[]) => mockClearAuthSession(...args),
  getSessionSnapshot: (...args: unknown[]) => mockGetSessionSnapshot(...args),
  setAuthSession: (...args: unknown[]) => mockSetAuthSession(...args),
}));

jest.mock('@/src/services/session/device-context', () => ({
  getDeviceContext: (...args: unknown[]) => mockGetDeviceContext(...args),
}));

function createJsonResponse(status: number, payload: unknown) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: jest.fn().mockResolvedValue(payload),
  } as unknown as Response;
}

describe('api client resilience', () => {
  const expiredSession: AuthSession = {
    accessToken: 'expired-token',
    refreshToken: 'refresh-token',
    accessTokenExpiresAt: '2026-04-11T12:00:00.000Z',
    refreshTokenExpiresAt: '2026-04-18T12:00:00.000Z',
    user: {
      id: 'employee-1',
      email: 'an.nguyen@flexshift.app',
      fullName: 'An Nguyen',
      phone: '0901000002',
      role: 'employee',
      status: 'active',
    },
  };

  const refreshedSession: AuthSession = {
    ...expiredSession,
    accessToken: 'refreshed-token',
    refreshToken: 'refresh-token-2',
  };

  beforeEach(() => {
    resetApiClientStateForTests();
    jest.useRealTimers();
    jest.clearAllMocks();
    mockGetSessionSnapshot.mockReturnValue({
      session: expiredSession,
      status: 'authenticated',
    });
    global.fetch = jest.fn() as unknown as typeof fetch;
  });

  it('reuses a single refresh flow when multiple requests hit 401 together', async () => {
    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    let refreshCalls = 0;

    fetchMock.mockImplementation((input, init) => {
      const url = String(input);
      const authorization = new Headers(init?.headers).get('Authorization');

      if (url.endsWith('/auth/refresh')) {
        refreshCalls += 1;
        return Promise.resolve(createJsonResponse(200, refreshedSession));
      }

      if (authorization === 'Bearer refreshed-token') {
        return Promise.resolve(createJsonResponse(200, { ok: true }));
      }

      return Promise.resolve(
        createJsonResponse(401, {
          message: 'expired',
        }),
      );
    });

    const [first, second] = await Promise.all([
      apiRequest('/shifts'),
      apiRequest('/requests'),
    ]);

    expect(first).toEqual({ ok: true });
    expect(second).toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
    expect(mockSetAuthSession).toHaveBeenCalledWith(refreshedSession);
  });

  it('surfaces request timeouts as actionable API errors', async () => {
    jest.useFakeTimers();

    const fetchMock = global.fetch as jest.MockedFunction<typeof fetch>;
    fetchMock.mockImplementation((_input, init) => {
      return new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () => {
          const abortError = new Error('The operation was aborted.');
          abortError.name = 'AbortError';
          reject(abortError);
        });
      });
    });

    const requestPromise = apiRequest('/health', {
      auth: false,
      timeoutMs: 50,
    });
    const expectation = expect(requestPromise).rejects.toEqual(
      expect.objectContaining({
        status: 408,
        code: 'REQUEST_TIMEOUT',
      }),
    );

    await jest.advanceTimersByTimeAsync(50);
    await expectation;
  });
});
