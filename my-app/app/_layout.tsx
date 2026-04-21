import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import 'react-native-reanimated';

import { EmptyState } from '@/src/components/common/EmptyState';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { AppProvider } from '@/src/context/app-context';
import { SyncProvider } from '@/src/context/sync-context';
import { AppDatabaseProvider } from '@/src/db/sqlite-provider';
import { useAppState } from '@/src/hooks/use-app-state';
import { AppQueryProvider } from '@/src/providers/query-provider';

function RootNavigator() {
  const { bootstrapError, isReady, retryBootstrap } = useAppState();

  if (!isReady) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color={AppColors.primary} size="large" />
      </View>
    );
  }

  if (bootstrapError) {
    return (
      <View style={styles.errorScreen}>
        <EmptyState
          title={APP_COPY.bootstrap.loadFailedTitle}
          description={`${bootstrapError}\n\n${APP_COPY.bootstrap.loadFailedDescription}`}
          actionLabel={APP_COPY.common.retry}
          onAction={() => {
            void retryBootstrap();
          }}
        />
      </View>
    );
  }

  return (
    <>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: AppColors.background },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(employee)" />
        <Stack.Screen name="(manager)" />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppQueryProvider>
      <AppDatabaseProvider>
        <AppProvider>
          <SyncProvider>
            <RootNavigator />
          </SyncProvider>
        </AppProvider>
      </AppDatabaseProvider>
    </AppQueryProvider>
  );
}

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    backgroundColor: AppColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorScreen: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    padding: 24,
  },
});
