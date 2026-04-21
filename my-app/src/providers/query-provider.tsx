import {
  focusManager,
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query';
import { AppState, type AppStateStatus } from 'react-native';
import { useEffect } from 'react';

import type { PropsWithChildren } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 0,
    },
  },
});

function handleAppStateChange(status: AppStateStatus) {
  focusManager.setFocused(status === 'active');
}

export function AppQueryProvider({ children }: PropsWithChildren) {
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange,
    );
    return () => {
      subscription.remove();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

export function getAppQueryClient() {
  return queryClient;
}
