import { AppState } from 'react-native';
import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { useAppQueryClient } from '@/src/hooks/use-app-query-client';
import { useAppState } from '@/src/hooks/use-app-state';
import { AppEnv } from '@/src/config/env';
import {
  getPendingAnnouncementCount,
  hydrateSyncStatus,
  runSyncCycle,
} from '@/src/services/sync/sync-engine';

import { useSQLiteContext } from '../db/sqlite-provider';
import type { SyncStatusSnapshot } from '../types/models';

interface SyncContextValue {
  syncStatus: SyncStatusSnapshot;
  pendingAnnouncementCount: number;
  syncNow: () => Promise<void>;
}

const defaultSyncStatus: SyncStatusSnapshot = {
  networkState: 'degraded',
  lifecycle: 'idle',
  pendingMutationCount: 0,
  lastSuccessfulSyncAt: null,
  lastAttemptedSyncAt: null,
  lastError: null,
  serverCursor: 0,
  activeUserId: null,
};

const SyncContext = createContext<SyncContextValue | null>(null);

export function SyncProvider({ children }: PropsWithChildren) {
  const db = useSQLiteContext();
  const queryClient = useAppQueryClient();
  const { currentUser, notifyDataChanged, sessionStatus } = useAppState();
  const [syncStatus, setSyncStatus] =
    useState<SyncStatusSnapshot>(defaultSyncStatus);
  const [pendingAnnouncementCount, setPendingAnnouncementCount] = useState(0);

  const refreshLocalSyncState = useCallback(async () => {
    const [status, announcementCount] = await Promise.all([
      hydrateSyncStatus(db),
      getPendingAnnouncementCount(db),
    ]);
    setSyncStatus(status);
    setPendingAnnouncementCount(announcementCount);
  }, [db]);

  const syncNow = useCallback(async () => {
    if (!currentUser) {
      await refreshLocalSyncState();
      return;
    }

    try {
      const status = await runSyncCycle(db);
      setSyncStatus(status);
    } catch {
      setSyncStatus(await hydrateSyncStatus(db));
    } finally {
      setPendingAnnouncementCount(await getPendingAnnouncementCount(db));
      await queryClient.invalidateQueries();
      notifyDataChanged();
    }
  }, [currentUser, db, notifyDataChanged, queryClient, refreshLocalSyncState]);

  useEffect(() => {
    void refreshLocalSyncState();
  }, [refreshLocalSyncState]);

  useEffect(() => {
    if (sessionStatus !== 'authenticated' || !currentUser) {
      return;
    }

    void syncNow();

    const appStateSubscription = AppState.addEventListener(
      'change',
      (state) => {
        if (state === 'active') {
          void syncNow();
        }
      },
    );
    const interval = setInterval(() => {
      void syncNow();
    }, AppEnv.syncPollIntervalMs);

    return () => {
      appStateSubscription.remove();
      clearInterval(interval);
    };
  }, [currentUser, sessionStatus, syncNow]);

  const value = useMemo<SyncContextValue>(
    () => ({
      syncStatus,
      pendingAnnouncementCount,
      syncNow,
    }),
    [pendingAnnouncementCount, syncNow, syncStatus],
  );

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSyncState() {
  const value = useContext(SyncContext);

  if (!value) {
    throw new Error('useSyncState must be used within SyncProvider');
  }

  return value;
}
