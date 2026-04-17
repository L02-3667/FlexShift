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

    expect(screen.getByText('Trạng thái đồng bộ')).toBeTruthy();
    expect(
      screen.getByText('Đang offline. Thay đổi mới sẽ vào hàng đợi an toàn.'),
    ).toBeTruthy();

    fireEvent.press(screen.getByLabelText('Đồng bộ ngay'));
    expect(mockSyncNow).toHaveBeenCalledTimes(1);
  });
});
