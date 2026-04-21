jest.mock('react-native-reanimated', () =>
  require('react-native-reanimated/mock'),
);

jest.mock('react-native-safe-area-context', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    SafeAreaProvider: ({ children }: { children?: React.ReactNode }) =>
      React.createElement(View, null, children),
    SafeAreaView: ({
      children,
      ...props
    }: {
      children?: React.ReactNode;
      [key: string]: unknown;
    }) => React.createElement(View, props, children),
    useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
    initialWindowMetrics: {
      frame: { x: 0, y: 0, width: 390, height: 844 },
      insets: { top: 0, right: 0, bottom: 0, left: 0 },
    },
  };
});

jest.mock('@expo/vector-icons', () => {
  const React = require('react');

  const MockIonicons = ({ children }: { children?: React.ReactNode }) =>
    React.createElement(React.Fragment, null, children ?? null);

  MockIonicons.glyphMap = new Proxy(
    {},
    {
      get: () => 'mock-icon',
    },
  );

  return {
    Ionicons: MockIonicons,
  };
});

jest.mock('expo-symbols', () => {
  const React = require('react');

  return {
    SymbolView: ({ fallback }: { fallback?: React.ReactNode }) =>
      fallback ?? React.createElement(React.Fragment, null),
  };
});

jest.mock('expo-constants', () => ({
  expoConfig: {
    version: '1.0.0-test',
    extra: {},
  },
}));
