import {
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react-native';

import { LoginScreen } from '@/src/screens/auth/login-screen';

const mockLogin = jest.fn();
const mockRetryBootstrap = jest.fn();

jest.mock('expo-router', () => ({
  router: {
    replace: jest.fn(),
  },
}));

const mockRouter = jest.requireMock('expo-router').router as {
  replace: jest.Mock;
};

jest.mock('@/src/hooks/use-app-state', () => ({
  useAppState: () => ({
    authError: null,
    bootstrapError: null,
    currentUser: null,
    isAuthenticating: false,
    login: mockLogin,
    retryBootstrap: mockRetryBootstrap,
  }),
}));

jest.mock('@/src/services/session/session-store', () => ({
  getSessionSnapshot: () => ({
    session: {
      user: {
        role: 'manager',
      },
    },
  }),
}));

jest.mock('@/src/utils/routes', () => ({
  getHomeRouteForRole: () => '/(manager)/(tabs)/calendar',
}));

describe('LoginScreen', () => {
  beforeEach(() => {
    mockLogin.mockReset();
    mockRetryBootstrap.mockReset();
    mockRouter.replace.mockReset();
  });

  it('validates empty credentials before login', () => {
    render(<LoginScreen />);

    fireEvent.press(screen.getByLabelText('Đăng nhập'));

    expect(
      screen.getByText('Vui lòng nhập đầy đủ email và mật khẩu.'),
    ).toBeTruthy();
    expect(mockLogin).not.toHaveBeenCalled();
  });

  it('uses a dev seed account and submits login', async () => {
    mockLogin.mockResolvedValue(undefined);

    render(<LoginScreen />);

    fireEvent.press(screen.getByText('Quản lý'));
    fireEvent.press(screen.getByLabelText('Đăng nhập'));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'manager@flexshift.app',
        password: 'FlexShift123!',
      });
      expect(mockRouter.replace).toHaveBeenCalledWith(
        '/(manager)/(tabs)/calendar',
      );
    });
  });
});
