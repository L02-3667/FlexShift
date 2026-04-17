import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { CreateLeaveRequestScreen } from '@/src/screens/employee/create-leave-request-screen';
import { CreateYieldRequestScreen } from '@/src/screens/employee/create-yield-request-screen';
import { OpenShiftDetailScreen } from '@/src/screens/employee/open-shift-detail-screen';
import {
  employeeUser,
  sampleOpenShift,
  sampleSyncStatus,
} from '@/src/test-utils/fixtures';

const mockRefreshData = jest.fn().mockResolvedValue(undefined);
const mockClaimOpenShiftAction = jest
  .fn()
  .mockResolvedValue({ delivery: 'sent' });
const mockCreateLeaveRequestAction = jest
  .fn()
  .mockResolvedValue({ delivery: 'sent' });
const mockCreateYieldRequestAction = jest
  .fn()
  .mockResolvedValue({ delivery: 'queued' });

const mockUseAsyncData = jest.fn();
const mockEmployeeUser = employeeUser;
const mockSyncStatus = sampleSyncStatus;

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
    back: jest.fn(),
  },
  useLocalSearchParams: () => ({
    id: 'open-1',
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
    currentUser: mockEmployeeUser,
    refreshData: mockRefreshData,
    refreshToken: 1,
  }),
}));

jest.mock('@/src/hooks/use-async-data', () => ({
  useAsyncData: (...args: unknown[]) => mockUseAsyncData(...args),
}));

jest.mock('@/src/services/flexshift-actions', () => ({
  claimOpenShiftAction: (...args: unknown[]) =>
    mockClaimOpenShiftAction(...args),
  createLeaveRequestAction: (...args: unknown[]) =>
    mockCreateLeaveRequestAction(...args),
  createYieldRequestAction: (...args: unknown[]) =>
    mockCreateYieldRequestAction(...args),
}));

jest.mock('@/src/context/sync-context', () => ({
  useSyncState: () => ({
    pendingAnnouncementCount: 0,
    syncNow: jest.fn(),
    syncStatus: mockSyncStatus,
  }),
}));

describe('employee request and shift screens', () => {
  beforeEach(() => {
    mockUseAsyncData.mockReset();
    mockRouter.replace.mockReset();
    mockRouter.back.mockReset();
    mockRefreshData.mockClear();
    mockClaimOpenShiftAction.mockClear();
    mockCreateLeaveRequestAction.mockClear();
    mockCreateYieldRequestAction.mockClear();
  });

  it('creates a leave request from a selected shift', async () => {
    mockUseAsyncData.mockReturnValue({
      data: {
        upcomingShifts: [
          {
            id: 'shift-1',
            date: '2026-04-11',
            startTime: '08:00',
            endTime: '12:00',
            position: 'Thu ngân',
            storeName: 'Central Market',
            status: 'scheduled',
          },
        ],
        coworkers: [],
      },
      error: null,
      loading: false,
      reload: jest.fn(),
    });

    render(<CreateLeaveRequestScreen />);

    fireEvent.press(screen.getByText('Thu ngân'));
    fireEvent.changeText(
      screen.getByLabelText('Lý do xin nghỉ'),
      'Cần nghỉ để xử lý việc gia đình.',
    );
    fireEvent.press(screen.getByLabelText('Gửi yêu cầu xin nghỉ'));

    await waitFor(() => {
      expect(mockCreateLeaveRequestAction).toHaveBeenCalled();
    });
  });

  it('creates a yield request with a selected coworker', async () => {
    mockUseAsyncData.mockReturnValue({
      data: {
        upcomingShifts: [
          {
            id: 'shift-2',
            date: '2026-04-12',
            startTime: '13:00',
            endTime: '17:00',
            position: 'Bán hàng',
            storeName: 'Riverside Kiosk',
            status: 'scheduled',
          },
        ],
        coworkers: [
          {
            id: 'employee-2',
            fullName: 'Linh Trần',
            email: 'linh.tran@flexshift.app',
            phone: '0901000003',
          },
        ],
      },
      error: null,
      loading: false,
      reload: jest.fn(),
    });

    render(<CreateYieldRequestScreen />);

    fireEvent.press(screen.getByText('Bán hàng'));
    fireEvent.press(screen.getByText('Linh Trần'));
    fireEvent.changeText(
      screen.getByLabelText('Lý do nhường ca'),
      'Cần đổi lịch với đồng nghiệp.',
    );
    fireEvent.press(screen.getByLabelText('Gửi đề nghị nhường ca'));

    await waitFor(() => {
      expect(mockCreateYieldRequestAction).toHaveBeenCalled();
    });
  });

  it('claims an open shift from the detail screen', async () => {
    mockUseAsyncData.mockReturnValue({
      data: sampleOpenShift,
      error: null,
      loading: false,
      reload: jest.fn(),
    });

    render(<OpenShiftDetailScreen />);

    fireEvent.press(screen.getByLabelText('Nhận ca này'));

    await waitFor(() => {
      expect(mockClaimOpenShiftAction).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/(employee)/(tabs)/open-shifts',
      );
    });
  });
});
