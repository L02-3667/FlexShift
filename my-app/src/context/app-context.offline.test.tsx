import { render, screen, waitFor } from '@testing-library/react-native';
import { Text } from 'react-native';

import { AppProvider, useAppContext } from '@/src/context/app-context';
import { AppQueryProvider } from '@/src/providers/query-provider';
import { employeeUser } from '@/src/test-utils/fixtures';

const mockDb = {};
const mockGetUsers = jest.fn();
const mockReplaceUsersCache = jest.fn();
const mockClearOperationalState = jest.fn();
const mockGetCurrentUserRequest = jest.fn();
const mockGetEmployeesRequest = jest.fn();
const mockLoginRequest = jest.fn();
const mockLogoutRequest = jest.fn();
const mockClearAuthSession = jest.fn();
const mockGetSessionSnapshot = jest.fn();
const mockRestoreSessionSnapshot = jest.fn();
const mockSetAuthSession = jest.fn();
const mockSubscribeSession = jest.fn();
const mockGetDeviceContext = jest.fn();

jest.mock('@/src/db/sqlite-provider', () => ({
  useSQLiteContext: () => mockDb,
}));

jest.mock('@/src/db/repositories', () => ({
  clearOperationalState: (...args: unknown[]) =>
    mockClearOperationalState(...args),
  getUsers: (...args: unknown[]) => mockGetUsers(...args),
  replaceUsersCache: (...args: unknown[]) => mockReplaceUsersCache(...args),
}));

jest.mock('@/src/services/api/flexshift-api', () => ({
  getCurrentUserRequest: (...args: unknown[]) =>
    mockGetCurrentUserRequest(...args),
  getEmployeesRequest: (...args: unknown[]) => mockGetEmployeesRequest(...args),
  loginRequest: (...args: unknown[]) => mockLoginRequest(...args),
  logoutRequest: (...args: unknown[]) => mockLogoutRequest(...args),
}));

jest.mock('@/src/services/session/session-store', () => ({
  clearAuthSession: (...args: unknown[]) => mockClearAuthSession(...args),
  getSessionSnapshot: (...args: unknown[]) => mockGetSessionSnapshot(...args),
  restoreSessionSnapshot: (...args: unknown[]) =>
    mockRestoreSessionSnapshot(...args),
  setAuthSession: (...args: unknown[]) => mockSetAuthSession(...args),
  subscribeSession: (...args: unknown[]) => mockSubscribeSession(...args),
}));

jest.mock('@/src/services/session/device-context', () => ({
  getDeviceContext: (...args: unknown[]) => mockGetDeviceContext(...args),
}));

function ContextProbe() {
  const state = useAppContext();

  return (
    <Text testID="context-state">
      {JSON.stringify({
        currentUserId: state.currentUser?.id ?? null,
        authError: state.authError,
        bootstrapError: state.bootstrapError,
        isReady: state.isReady,
        sessionStatus: state.sessionStatus,
      })}
    </Text>
  );
}

function renderAppProvider() {
  return render(
    <AppQueryProvider>
      <AppProvider>
        <ContextProbe />
      </AppProvider>
    </AppQueryProvider>,
  );
}

describe('AppProvider degraded boot', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRestoreSessionSnapshot.mockResolvedValue(undefined);
    mockGetSessionSnapshot.mockReturnValue({
      session: {
        user: employeeUser,
      },
      status: 'authenticated',
    });
    mockSubscribeSession.mockImplementation(() => () => undefined);
    mockReplaceUsersCache.mockResolvedValue(undefined);
    mockClearOperationalState.mockResolvedValue(undefined);
    mockClearAuthSession.mockResolvedValue(undefined);
    mockSetAuthSession.mockResolvedValue(undefined);
    mockGetDeviceContext.mockResolvedValue({
      deviceId: 'device-1',
    });
  });

  it('boots from cached users when the server is unavailable', async () => {
    mockGetCurrentUserRequest.mockRejectedValue(
      new TypeError('Network request failed'),
    );
    mockGetEmployeesRequest.mockRejectedValue(
      new TypeError('Network request failed'),
    );
    mockGetUsers.mockResolvedValue([employeeUser]);

    renderAppProvider();

    await waitFor(() => {
      const payload = JSON.parse(
        screen.getByTestId('context-state').props.children,
      );
      expect(payload).toMatchObject({
        currentUserId: employeeUser.id,
        isReady: true,
        sessionStatus: 'authenticated',
      });
      expect(payload.authError).toContain('Network request failed');
    });
  });

  it('falls back to the session shell when the user cache is empty', async () => {
    mockGetCurrentUserRequest.mockRejectedValue(
      new TypeError('Network request failed'),
    );
    mockGetEmployeesRequest.mockRejectedValue(
      new TypeError('Network request failed'),
    );
    mockGetUsers.mockResolvedValue([]);

    renderAppProvider();

    await waitFor(() => {
      const payload = JSON.parse(
        screen.getByTestId('context-state').props.children,
      );
      expect(payload.currentUserId).toBe(employeeUser.id);
      expect(payload.isReady).toBe(true);
      expect(payload.sessionStatus).toBe('authenticated');
      expect(payload.authError).toContain('Network request failed');
      expect(payload.bootstrapError).toBeNull();
    });
  });
});
