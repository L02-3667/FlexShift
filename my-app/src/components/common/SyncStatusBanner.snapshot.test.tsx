import { render } from '@testing-library/react-native';

import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { sampleSyncStatus } from '@/src/test-utils/fixtures';

const mockSyncStatus = sampleSyncStatus;

jest.mock('@/src/context/sync-context', () => ({
  useSyncState: () => ({
    pendingAnnouncementCount: 1,
    syncNow: jest.fn(),
    syncStatus: mockSyncStatus,
  }),
}));

describe('SyncStatusBanner snapshot', () => {
  it('matches the stable sync banner snapshot', () => {
    const { toJSON } = render(<SyncStatusBanner />);
    expect(toJSON()).toMatchSnapshot();
  });
});
