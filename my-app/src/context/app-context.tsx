import { useSQLiteContext } from '@/src/db/sqlite-provider';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  clearOperationalState,
  getUsers,
  replaceUsersCache,
} from '@/src/db/repositories';
import { useAppQueryClient } from '@/src/hooks/use-app-query-client';
import {
  getCurrentUserRequest,
  getEmployeesRequest,
  loginRequest,
  logoutRequest,
} from '@/src/services/api/flexshift-api';
import { ApiUnauthorizedError } from '@/src/services/api/api-errors';
import {
  clearAuthSession,
  getSessionSnapshot,
  restoreSessionSnapshot,
  setAuthSession,
  subscribeSession,
} from '@/src/services/session/session-store';
import { getDeviceContext } from '@/src/services/session/device-context';
import type { LoginInput, SessionStatus, User } from '@/src/types/models';

function toErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Không thể tiếp tục với phiên làm việc hiện tại.';
}

function mergeUsers(currentUser: User | null, employees: User[]) {
  const seen = new Set<string>();
  const nextUsers: User[] = [];

  const append = (user: User | null) => {
    if (!user || seen.has(user.id)) {
      return;
    }

    seen.add(user.id);
    nextUsers.push(user);
  };

  append(currentUser);
  employees.forEach(append);

  return nextUsers;
}

interface AppContextValue {
  currentUser: User | null;
  users: User[];
  employees: User[];
  manager: User | null;
  isReady: boolean;
  refreshToken: number;
  bootstrapError: string | null;
  authError: string | null;
  sessionStatus: SessionStatus;
  isAuthenticating: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => Promise<void>;
  refreshData: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  notifyDataChanged: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const queryClient = useAppQueryClient();
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [isReady, setIsReady] = useState(false);
  const [refreshToken, setRefreshToken] = useState(0);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [sessionStatus, setSessionStatus] = useState<SessionStatus>('idle');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const notifyDataChanged = useCallback(() => {
    setRefreshToken((current) => current + 1);
  }, []);

  const hydrateUserShell = useCallback(
    async (fallbackUser: User | null, options?: { silent?: boolean }) => {
      try {
        const [me, employees] = await Promise.all([
          getCurrentUserRequest(),
          getEmployeesRequest(),
        ]);

        if (!me) {
          await clearAuthSession();
          setCurrentUser(null);
          setUsers([]);
          return;
        }

        const nextUsers = mergeUsers(me, employees);
        await replaceUsersCache(db, nextUsers);
        setCurrentUser(me);
        setUsers(nextUsers);
        setSessionStatus('authenticated');
        setAuthError(null);
      } catch (error) {
        if (error instanceof ApiUnauthorizedError) {
          await clearAuthSession();
          setCurrentUser(null);
          setUsers([]);
          setAuthError(error.message);
          return;
        }

        const cachedUsers = await getUsers(db).catch(() => []);
        const cachedCurrentUser =
          cachedUsers.find((user) => user.id === fallbackUser?.id) ??
          fallbackUser;

        if (cachedCurrentUser) {
          setCurrentUser(cachedCurrentUser);
          setUsers(
            cachedUsers.length > 0
              ? cachedUsers
              : mergeUsers(cachedCurrentUser, []),
          );
          setSessionStatus('authenticated');
        }

        if (!options?.silent) {
          setAuthError(toErrorMessage(error));
        }

        if (!cachedCurrentUser) {
          throw error;
        }
      }
    },
    [db],
  );

  const bootstrap = useCallback(async () => {
    try {
      setBootstrapError(null);
      setAuthError(null);
      await restoreSessionSnapshot();

      const snapshot = getSessionSnapshot();

      if (!snapshot.session) {
        setCurrentUser(null);
        setUsers([]);
        setSessionStatus('unauthenticated');
        return;
      }

      await hydrateUserShell(snapshot.session.user);
    } catch (error) {
      setBootstrapError(toErrorMessage(error));
    } finally {
      setIsReady(true);
    }
  }, [hydrateUserShell]);

  useEffect(() => {
    const unsubscribe = subscribeSession((snapshot) => {
      setSessionStatus(snapshot.status);

      if (!snapshot.session) {
        setCurrentUser(null);
      } else {
        const sessionUser = snapshot.session.user;
        setCurrentUser((previous) =>
          previous && previous.id === sessionUser.id
            ? { ...previous, ...sessionUser }
            : sessionUser,
        );
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(
    async (input: LoginInput) => {
      setIsAuthenticating(true);
      setAuthError(null);

      try {
        const deviceContext = await getDeviceContext();
        const session = await loginRequest({
          ...input,
          ...deviceContext,
        });
        await setAuthSession(session);
        await hydrateUserShell(session.user, { silent: true });
        await queryClient.invalidateQueries();
        notifyDataChanged();
      } catch (error) {
        const message = toErrorMessage(error);
        setAuthError(message);
        throw new Error(message);
      } finally {
        setIsAuthenticating(false);
      }
    },
    [hydrateUserShell, notifyDataChanged, queryClient],
  );

  const logout = useCallback(async () => {
    setIsAuthenticating(true);

    try {
      const snapshot = getSessionSnapshot();

      if (snapshot.session?.refreshToken) {
        await logoutRequest(snapshot.session.refreshToken).catch(
          () => undefined,
        );
      }
    } finally {
      await clearAuthSession();
      await clearOperationalState(db).catch(() => undefined);
      setUsers([]);
      setAuthError(null);
      await queryClient.clear();
      notifyDataChanged();
      setIsAuthenticating(false);
    }
  }, [db, notifyDataChanged, queryClient]);

  const refreshData = useCallback(async () => {
    const snapshot = getSessionSnapshot();

    if (snapshot.session) {
      await hydrateUserShell(snapshot.session.user, { silent: true });
    }

    await queryClient.invalidateQueries();
    notifyDataChanged();
  }, [hydrateUserShell, notifyDataChanged, queryClient]);

  const retryBootstrap = useCallback(async () => {
    setIsReady(false);
    await bootstrap();
  }, [bootstrap]);

  const employees = useMemo(
    () => users.filter((user) => user.role === 'employee'),
    [users],
  );
  const manager = useMemo(
    () => users.find((user) => user.role === 'manager') ?? null,
    [users],
  );

  const value = useMemo<AppContextValue>(
    () => ({
      currentUser,
      users,
      employees,
      manager,
      isReady,
      refreshToken,
      bootstrapError,
      authError,
      sessionStatus,
      isAuthenticating,
      login,
      logout,
      refreshData,
      retryBootstrap,
      notifyDataChanged,
    }),
    [
      authError,
      bootstrapError,
      currentUser,
      employees,
      isAuthenticating,
      isReady,
      login,
      logout,
      manager,
      refreshData,
      refreshToken,
      retryBootstrap,
      sessionStatus,
      users,
      notifyDataChanged,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const value = useContext(AppContext);

  if (!value) {
    throw new Error('useAppContext must be used within AppProvider');
  }

  return value;
}
