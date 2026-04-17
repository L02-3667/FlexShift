import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { SettingsScreenContent } from '@/src/components/settings/SettingsScreenContent';
import { managerUser, sampleSettings } from '@/src/test-utils/fixtures';

const mockLogout = jest.fn().mockResolvedValue(undefined);
const mockSaveSettingsData = jest.fn().mockResolvedValue({
  ...sampleSettings,
  theme: 'light',
});
const mockUseAsyncData = jest.fn();
const mockManagerUser = managerUser;

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockRouter = jest.requireMock('expo-router').router as {
  replace: jest.Mock;
};

jest.mock('@/src/db/sqlite-provider', () => ({
  useSQLiteContext: () => ({}),
}));

jest.mock('@/src/hooks/use-app-state', () => ({
  useAppState: () => ({
    currentUser: mockManagerUser,
    logout: mockLogout,
  }),
}));

jest.mock('@/src/hooks/use-async-data', () => ({
  useAsyncData: (...args: unknown[]) => mockUseAsyncData(...args),
}));

jest.mock('@/src/services/flexshift-service', () => ({
  getSettingsData: jest.fn(),
  saveSettingsData: (...args: unknown[]) => mockSaveSettingsData(...args),
}));

describe('SettingsScreenContent', () => {
  beforeEach(() => {
    mockUseAsyncData.mockReturnValue({
      data: sampleSettings,
      error: null,
      loading: false,
      reload: jest.fn(),
    });
    mockRouter.replace.mockReset();
    mockLogout.mockClear();
    mockSaveSettingsData.mockClear();
  });

  it('saves a theme change and supports logout', async () => {
    render(
      <SettingsScreenContent
        title="Cài đặt"
        subtitle="Đồng bộ ưu tiên và thông báo."
      />,
    );

    fireEvent.press(screen.getByText('Sang'));

    await waitFor(() => {
      expect(mockSaveSettingsData).toHaveBeenCalled();
    });

    fireEvent.press(screen.getByLabelText('Đăng xuất'));

    await waitFor(() => {
      expect(mockLogout).toHaveBeenCalled();
      expect(mockRouter.replace).toHaveBeenCalledWith('/(auth)/login');
    });
  });
});
