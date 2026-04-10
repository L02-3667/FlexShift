import type { SQLiteDatabase } from '@/src/db/sqlite-provider';
import {
  acknowledgeAnnouncementCache,
  enqueuePendingMutation,
  ensureOperationalUserScope,
  getCachedAnnouncements,
  getPendingMutationById,
  getPendingMutationCount,
  getPendingMutations,
  getSyncCursor,
  getSyncStatusSnapshot,
  removeCompletedPendingMutations,
  replaceCachedActivityLogs,
  replaceCachedAnnouncements,
  replaceCachedChecklists,
  replaceCachedNotifications,
  replaceOpenShiftsCache,
  setSyncCursor,
  setSyncStatusSnapshot,
  updatePendingMutation,
  upsertRequestCache,
  upsertShiftCache,
  upsertUserSetting,
} from '@/src/db/repositories';
import type {
  AnnouncementItem,
  MutationActionResult,
  PendingMutationRecord,
  PendingMutationType,
  SyncStatusSnapshot,
} from '@/src/types/models';
import { createId } from '@/src/utils/id';

import { ApiError } from '../api/api-errors';
import {
  acknowledgeAnnouncementRequest,
  approveRequestRequest,
  claimOpenShiftRequest,
  createLeaveRequestRequest,
  createOpenShiftRequest,
  createYieldRequestRequest,
  getSyncPullRequest,
  rejectRequestRequest,
} from '../api/flexshift-api';
import { getSessionSnapshot } from '../session/session-store';
import {
  buildFailedMutationRecord,
  buildSyncSnapshot,
  countPendingAcknowledgements,
  isLikelyOfflineError,
} from './sync-helpers';

export async function createPendingMutationRecord(input: {
  type: PendingMutationType;
  payload: object;
  entityId?: string | null;
  entityType: string;
  dedupeKey: string;
}): Promise<PendingMutationRecord> {
  return {
    clientMutationId: createId('mutation'),
    type: input.type,
    payload: JSON.stringify(input.payload),
    entityId: input.entityId ?? null,
    entityType: input.entityType,
    createdAt: new Date().toISOString(),
    retryCount: 0,
    status: 'queued',
    lastError: null,
    requiresNetwork: true,
    dedupeKey: input.dedupeKey,
  };
}

async function sendPendingMutation(mutation: PendingMutationRecord) {
  const payload = JSON.parse(mutation.payload) as Record<string, unknown>;

  switch (mutation.type) {
    case 'open_shift_create':
      return createOpenShiftRequest({
        date: String(payload.date),
        startTime: String(payload.startTime),
        endTime: String(payload.endTime),
        storeName: String(payload.storeName),
        position: String(payload.position),
        note: String(payload.note),
        clientMutationId: mutation.clientMutationId,
        dedupeKey: mutation.dedupeKey,
      });
    case 'open_shift_claim':
      return claimOpenShiftRequest(String(payload.openShiftId), {
        clientMutationId: mutation.clientMutationId,
        dedupeKey: mutation.dedupeKey,
      });
    case 'request_leave':
      return createLeaveRequestRequest({
        shiftId: String(payload.shiftId),
        reason: String(payload.reason),
        clientMutationId: mutation.clientMutationId,
        dedupeKey: mutation.dedupeKey,
      });
    case 'request_yield':
      return createYieldRequestRequest({
        shiftId: String(payload.shiftId),
        targetEmployeeId: String(payload.targetEmployeeId),
        reason: String(payload.reason),
        clientMutationId: mutation.clientMutationId,
        dedupeKey: mutation.dedupeKey,
      });
    case 'request_approve':
      return approveRequestRequest(
        String(payload.requestId),
        typeof payload.managerNote === 'string'
          ? payload.managerNote
          : undefined,
        mutation.clientMutationId,
        mutation.dedupeKey,
      );
    case 'request_reject':
      return rejectRequestRequest(
        String(payload.requestId),
        typeof payload.managerNote === 'string'
          ? payload.managerNote
          : undefined,
        mutation.clientMutationId,
        mutation.dedupeKey,
      );
    case 'announcement_ack':
      return acknowledgeAnnouncementRequest(String(payload.announcementId), {
        clientMutationId: mutation.clientMutationId,
        dedupeKey: mutation.dedupeKey,
      });
    default:
      return null;
  }
}

async function applySyncPull(
  db: SQLiteDatabase,
  response: Awaited<ReturnType<typeof getSyncPullRequest>>,
) {
  const { domains } = response;

  if (domains.shifts.items.length > 0) {
    await upsertShiftCache(db, domains.shifts.items);
  }

  if (domains.openShifts.items.length > 0) {
    await replaceOpenShiftsCache(db, domains.openShifts.items);
  }

  if (domains.requests.items.length > 0) {
    await upsertRequestCache(db, domains.requests.items);
  }

  if (domains.notifications.items.length > 0) {
    await replaceCachedNotifications(db, domains.notifications.items);
  }

  if (domains.settings.items[0]) {
    const setting = domains.settings.items[0];
    await upsertUserSetting(db, {
      userId: setting.userId,
      notificationsEnabled: setting.notificationsEnabled,
      approvalUpdatesEnabled: setting.approvalUpdatesEnabled,
      openShiftAlertsEnabled: setting.openShiftAlertsEnabled,
      remindersEnabled: setting.remindersEnabled,
      reminderMinutesBefore: setting.reminderMinutesBefore,
      language: setting.language,
      theme: setting.theme,
    });
  }

  if (domains.announcements.items.length > 0) {
    await replaceCachedAnnouncements(db, domains.announcements.items);
  }

  if (domains.activity.items.length > 0) {
    await replaceCachedActivityLogs(db, domains.activity.items);
  }

  if (domains.checklists.items.length > 0) {
    await replaceCachedChecklists(db, domains.checklists.items);
  }

  await setSyncCursor(db, 'global', response.cursor);
}

async function updateSyncSnapshot(
  db: SQLiteDatabase,
  patch: Partial<SyncStatusSnapshot>,
) {
  const current = await getSyncStatusSnapshot(db);
  const next = buildSyncSnapshot(current, patch);
  await setSyncStatusSnapshot(db, next);
  return next;
}

export async function flushPendingMutations(db: SQLiteDatabase) {
  const pendingMutations = await getPendingMutations(db, ['queued', 'failed']);

  for (const mutation of pendingMutations) {
    await updatePendingMutation(db, {
      ...mutation,
      status: 'sending',
      lastError: null,
    });

    try {
      const response = await sendPendingMutation(mutation);

      await updatePendingMutation(db, {
        ...mutation,
        status: 'completed',
        lastError: null,
      });

      if (
        mutation.type === 'announcement_ack' &&
        response &&
        typeof response === 'object' &&
        'acknowledgedAt' in response
      ) {
        await acknowledgeAnnouncementCache(
          db,
          String(JSON.parse(mutation.payload).announcementId),
          String(response.acknowledgedAt),
        );
      }
    } catch (error) {
      const nextMutation: PendingMutationRecord = buildFailedMutationRecord(
        mutation,
        error,
      );

      await updatePendingMutation(db, nextMutation);
      throw error;
    }
  }

  await removeCompletedPendingMutations(db);
}

export async function runSyncCycle(db: SQLiteDatabase) {
  const session = getSessionSnapshot().session;

  if (!session?.accessToken) {
    return getSyncStatusSnapshot(db);
  }

  await ensureOperationalUserScope(db, session.user.id);

  const current = await updateSyncSnapshot(db, {
    lifecycle: 'syncing',
    lastAttemptedSyncAt: new Date().toISOString(),
    activeUserId: session.user.id,
  });

  try {
    await flushPendingMutations(db);

    const cursor = await getSyncCursor(db, 'global');
    const syncResponse = await getSyncPullRequest(cursor);
    await applySyncPull(db, syncResponse);

    const pendingMutationCount = await getPendingMutationCount(db);
    return updateSyncSnapshot(db, {
      lifecycle: 'idle',
      networkState: 'online',
      lastSuccessfulSyncAt: syncResponse.serverTime,
      lastError: null,
      pendingMutationCount,
      serverCursor: syncResponse.serverCursor,
      activeUserId: session.user.id,
    });
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      const cursor = await getSyncCursor(db, 'global');
      const syncResponse = await getSyncPullRequest(cursor);
      await applySyncPull(db, syncResponse);
    }

    await updateSyncSnapshot(db, {
      lifecycle: 'error',
      networkState: isLikelyOfflineError(error) ? 'offline' : 'degraded',
      lastError: error instanceof Error ? error.message : current.lastError,
      pendingMutationCount: await getPendingMutationCount(db),
      activeUserId: session.user.id,
    });
    throw error;
  }
}

export async function queueMutation(
  db: SQLiteDatabase,
  mutation: PendingMutationRecord,
): Promise<MutationActionResult> {
  await enqueuePendingMutation(db, mutation);

  try {
    await runSyncCycle(db);
  } catch (error) {
    if (error instanceof ApiError && error.status === 409) {
      throw error;
    }
  }

  const latest = await getPendingMutationById(db, mutation.clientMutationId);

  return {
    clientMutationId: mutation.clientMutationId,
    delivery: latest ? 'queued' : 'sent',
  };
}

export async function hydrateSyncStatus(db: SQLiteDatabase) {
  return getSyncStatusSnapshot(db);
}

export async function getPendingAnnouncementCount(db: SQLiteDatabase) {
  const announcements = await getCachedAnnouncements(db);
  return countPendingAcknowledgements(announcements as AnnouncementItem[]);
}
