import { fireEvent, render, screen } from '@testing-library/react-native';

import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { sampleSyncStatus } from '@/src/test-utils/fixtures';

const mockSyncNow = jest.fn();
const mockSyncStatus = sampleSyncStatus;

jest.mock('@/src/context/sync-context', () => ({
  useSyncState: () => ({
    pendingAnnouncementCount: 1,
    syncNow: mockSyncNow,
    syncStatus: mockSyncStatus,
  }),
}));

describe('SyncStatusBanner', () => {
  beforeEach(() => {
    mockSyncNow.mockReset();
  });

  it('renders offline sync state and triggers a manual sync', () => {
    render(<SyncStatusBanner />);

    expect(screen.getByText('Trang thai dong bo')).toBeTruthy();
    expect(
      screen.getByText('Dang offline. Thay doi moi se vao hang doi an toan.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Dong bo ngay'));
    expect(mockSyncNow).toHaveBeenCalledTimes(1);
  });
});
