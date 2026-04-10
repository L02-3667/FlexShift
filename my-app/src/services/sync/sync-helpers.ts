import type {
  AnnouncementItem,
  PendingMutationRecord,
  SyncStatusSnapshot,
} from '@/src/types/models';

import { ApiError } from '../api/api-errors';

export function isLikelyOfflineError(error: unknown) {
  if (error instanceof TypeError) {
    return true;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network request failed') ||
      message.includes('failed to fetch') ||
      message.includes('khong the ket noi')
    );
  }

  return false;
}

export function buildSyncSnapshot(
  current: SyncStatusSnapshot,
  patch: Partial<SyncStatusSnapshot>,
): SyncStatusSnapshot {
  return {
    ...current,
    ...patch,
  };
}

export function buildFailedMutationRecord(
  mutation: PendingMutationRecord,
  error: unknown,
): PendingMutationRecord {
  return {
    ...mutation,
    retryCount: mutation.retryCount + 1,
    status:
      error instanceof ApiError && error.status === 409 ? 'conflict' : 'failed',
    lastError:
      error instanceof Error ? error.message : 'Khong the dong bo thay doi.',
  };
}

export function countPendingAcknowledgements(
  announcements: AnnouncementItem[],
) {
  return announcements.filter(
    (announcement) => announcement.requiresAck && !announcement.acknowledgedAt,
  ).length;
}
