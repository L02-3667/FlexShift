const mockRepositories = {
  acknowledgeAnnouncementCache: jest.fn(),
  enqueuePendingMutation: jest.fn(),
  ensureUsersExist: jest.fn(),
  ensureOperationalUserScope: jest.fn(),
  getCachedAnnouncements: jest.fn(),
  getPendingMutationById: jest.fn(),
  getPendingMutationCount: jest.fn(),
  getPendingMutations: jest.fn(),
  getSyncCursor: jest.fn(),
  getSyncStatusSnapshot: jest.fn(),
  removeCompletedPendingMutations: jest.fn(),
  replaceCachedActivityLogs: jest.fn(),
  replaceCachedAnnouncements: jest.fn(),
  replaceCachedChecklists: jest.fn(),
  replaceCachedNotifications: jest.fn(),
  replaceOpenShiftsCache: jest.fn(),
  setSyncCursor: jest.fn(),
  setSyncStatusSnapshot: jest.fn(),
  updatePendingMutation: jest.fn(),
  upsertRequestCache: jest.fn(),
  upsertShiftCache: jest.fn(),
  upsertUserSetting: jest.fn(),
};

const mockApi = {
  acknowledgeAnnouncementRequest: jest.fn(),
  approveRequestRequest: jest.fn(),
  claimOpenShiftRequest: jest.fn(),
  createLeaveRequestRequest: jest.fn(),
  createOpenShiftRequest: jest.fn(),
  createYieldRequestRequest: jest.fn(),
  getSyncPullRequest: jest.fn(),
  rejectRequestRequest: jest.fn(),
};

const mockGetSessionSnapshot = jest.fn();

jest.mock('@/src/db/repositories', () => mockRepositories);
jest.mock('@/src/services/api/flexshift-api', () => mockApi);
jest.mock('@/src/services/session/session-store', () => ({
  getSessionSnapshot: (...args: unknown[]) => mockGetSessionSnapshot(...args),
}));

describe('sync engine resilience', () => {
  const db = {} as never;
  let syncEngine: typeof import('@/src/services/sync/sync-engine');
  const flushAsyncWork = () =>
    new Promise<void>((resolve) => {
      setImmediate(() => resolve());
    });

  beforeEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    syncEngine = require('@/src/services/sync/sync-engine');
    syncEngine.resetSyncEngineStateForTests();
    mockGetSessionSnapshot.mockReturnValue({
      session: {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
        user: {
          id: 'employee-1',
        },
      },
    });
    mockRepositories.getPendingMutationCount.mockResolvedValue(0);
    mockRepositories.getPendingMutations.mockResolvedValue([]);
    mockRepositories.getSyncCursor.mockResolvedValue(0);
    mockRepositories.getCachedAnnouncements.mockResolvedValue([]);
    mockRepositories.getSyncStatusSnapshot.mockResolvedValue({
      networkState: 'online',
      lifecycle: 'idle',
      pendingMutationCount: 0,
      lastSuccessfulSyncAt: null,
      lastAttemptedSyncAt: null,
      lastError: null,
      serverCursor: 0,
      activeUserId: 'employee-1',
    });
  });

  it('deduplicates overlapping sync cycles', async () => {
    let resolvePull: ((value: unknown) => void) | undefined;
    mockApi.getSyncPullRequest.mockReturnValue(
      new Promise((resolve) => {
        resolvePull = resolve;
      }),
    );

    const firstRun = syncEngine.runSyncCycle(db);
    const secondRun = syncEngine.runSyncCycle(db);

    await flushAsyncWork();
    expect(mockApi.getSyncPullRequest).toHaveBeenCalledTimes(1);

    resolvePull?.({
      cursor: 3,
      serverCursor: 3,
      hasMore: false,
      serverTime: '2026-04-11T12:00:00.000Z',
      staleAfterMs: 300000,
      domains: {
        shifts: { items: [], deletedIds: [], cursor: 3 },
        openShifts: { items: [], deletedIds: [], cursor: 3 },
        requests: { items: [], deletedIds: [], cursor: 3 },
        notifications: { items: [], deletedIds: [], cursor: 3 },
        settings: { items: [], deletedIds: [], cursor: 3 },
        announcements: { items: [], deletedIds: [], cursor: 3 },
        activity: { items: [], deletedIds: [], cursor: 3 },
        checklists: { items: [], deletedIds: [], cursor: 3 },
      },
    });

    await expect(Promise.all([firstRun, secondRun])).resolves.toEqual([
      expect.objectContaining({
        networkState: 'online',
        lifecycle: 'idle',
        serverCursor: 3,
      }),
      expect.objectContaining({
        networkState: 'online',
        lifecycle: 'idle',
        serverCursor: 3,
      }),
    ]);
  });

  it('ensures the active user exists before writing synced settings', async () => {
    mockApi.getSyncPullRequest.mockResolvedValue({
      cursor: 5,
      serverCursor: 5,
      hasMore: false,
      serverTime: '2026-04-11T12:00:00.000Z',
      staleAfterMs: 300000,
      domains: {
        shifts: { items: [], deletedIds: [], cursor: 5 },
        openShifts: { items: [], deletedIds: [], cursor: 5 },
        requests: { items: [], deletedIds: [], cursor: 5 },
        notifications: { items: [], deletedIds: [], cursor: 5 },
        settings: {
          items: [
            {
              userId: 'employee-1',
              notificationsEnabled: true,
              approvalUpdatesEnabled: true,
              openShiftAlertsEnabled: true,
              remindersEnabled: true,
              reminderMinutesBefore: 60,
              language: 'vi',
              theme: 'system',
              updatedAt: '2026-04-11T12:00:00.000Z',
            },
          ],
          deletedIds: [],
          cursor: 5,
        },
        announcements: { items: [], deletedIds: [], cursor: 5 },
        activity: { items: [], deletedIds: [], cursor: 5 },
        checklists: { items: [], deletedIds: [], cursor: 5 },
      },
    });

    await syncEngine.runSyncCycle(db);

    expect(mockRepositories.ensureUsersExist).toHaveBeenCalledWith(db, [
      expect.objectContaining({
        id: 'employee-1',
      }),
    ]);
  });

  it('keeps a failed mutation queued and marks the sync snapshot offline', async () => {
    const mutation = await syncEngine.createPendingMutationRecord({
      type: 'open_shift_claim',
      payload: { openShiftId: 'open-1' },
      entityId: 'open-1',
      entityType: 'open_shift',
      dedupeKey: 'open_shift_claim:open-1',
    });

    mockRepositories.getPendingMutations.mockResolvedValue([mutation]);
    mockRepositories.getPendingMutationById.mockResolvedValue(mutation);
    mockRepositories.getPendingMutationCount.mockResolvedValue(1);
    mockApi.claimOpenShiftRequest.mockRejectedValue(
      new TypeError('Network request failed'),
    );

    await expect(syncEngine.queueMutation(db, mutation)).resolves.toEqual(
      expect.objectContaining({
        delivery: 'queued',
        clientMutationId: mutation.clientMutationId,
      }),
    );

    expect(mockRepositories.setSyncStatusSnapshot).toHaveBeenLastCalledWith(
      db,
      expect.objectContaining({
        networkState: 'offline',
        lifecycle: 'error',
        pendingMutationCount: 1,
      }),
    );
  });
});
