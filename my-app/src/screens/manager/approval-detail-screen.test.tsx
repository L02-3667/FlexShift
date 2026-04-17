import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { ApprovalDetailScreen } from '@/src/screens/manager/approval-detail-screen';
import {
  managerUser,
  sampleRequest,
  sampleSyncStatus,
} from '@/src/test-utils/fixtures';

const mockApproveRequestAction = jest
  .fn()
  .mockResolvedValue({ delivery: 'sent' });
const mockRejectRequestAction = jest
  .fn()
  .mockResolvedValue({ delivery: 'queued' });
const mockRefreshData = jest.fn().mockResolvedValue(undefined);
const mockUseAsyncData = jest.fn();
const mockManagerUser = managerUser;
const mockSyncStatus = sampleSyncStatus;

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({
    id: 'request-1',
  }),
}));

const mockRouter = jest.requireMock('expo-router').router as {
  replace: jest.Mock;
  back: jest.Mock;
};

jest.mock('@/src/db/sqlite-provider', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/src/hooks/use-app-state', () => ({
  useAppState: () => ({
    currentUser: mockManagerUser,
    refreshData: mockRefreshData,
    refreshToken: 1,
  }),
}));

jest.mock('@/src/hooks/use-async-data', () => ({
  useAsyncData: (...args: unknown[]) => mockUseAsyncData(...args),
}));

jest.mock('@/src/services/flexshift-actions', () => ({
  approveRequestAction: (...args: unknown[]) =>
    mockApproveRequestAction(...args),
  rejectRequestAction: (...args: unknown[]) => mockRejectRequestAction(...args),
}));

jest.mock('@/src/context/sync-context', () => ({
  useSyncState: () => ({
    pendingAnnouncementCount: 0,
    syncNow: jest.fn(),
    syncStatus: mockSyncStatus,
  }),
}));

describe('ApprovalDetailScreen', () => {
  beforeEach(() => {
    mockUseAsyncData.mockReturnValue({
      data: sampleRequest,
      error: null,
      loading: false,
      reload: jest.fn(),
    });
    mockRouter.replace.mockReset();
    mockApproveRequestAction.mockClear();
    mockRejectRequestAction.mockClear();
  });

  it('submits an approval action for a pending request', async () => {
    render(<ApprovalDetailScreen />);

    fireEvent.changeText(
      screen.getByLabelText('Ghi chu quan ly'),
      'Da xem va dong y.',
    );
    fireEvent.press(screen.getByLabelText('Duyệt yêu cầu'));

    await waitFor(() => {
      expect(mockApproveRequestAction).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/(manager)/(tabs)/approvals',
      );
    });
  });
});
