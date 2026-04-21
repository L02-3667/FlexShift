import { ApiError } from '@/src/services/api/api-errors';
import {
  buildFailedMutationRecord,
  buildSyncSnapshot,
  countPendingAcknowledgements,
  isLikelyOfflineError,
} from '@/src/services/sync/sync-helpers';
import {
  sampleAnnouncement,
  sampleSyncStatus,
} from '@/src/test-utils/fixtures';

describe('sync helpers', () => {
  it('merges sync snapshot patches', () => {
    expect(
      buildSyncSnapshot(sampleSyncStatus, {
        lifecycle: 'syncing',
      }).lifecycle,
    ).toBe('syncing');
  });

  it('marks 409 errors as conflict mutations', () => {
    const mutation = buildFailedMutationRecord(
      {
        clientMutationId: 'mutation-1',
        type: 'request_leave',
        payload: '{}',
        entityId: 'request-1',
        entityType: 'request',
        createdAt: '2026-04-10T08:00:00.000Z',
        retryCount: 0,
        status: 'queued',
        lastError: null,
        requiresNetwork: true,
        dedupeKey: 'request_leave:shift-1',
      },
      new ApiError('Conflict', 409, 'CONFLICT'),
    );

    expect(mutation.status).toBe('conflict');
    expect(mutation.retryCount).toBe(1);
  });

  it('detects likely offline errors and counts pending acknowledgements', () => {
    expect(isLikelyOfflineError(new TypeError('Network request failed'))).toBe(
      true,
    );
    expect(countPendingAcknowledgements([sampleAnnouncement])).toBe(1);
  });
});
