import type { PropsWithChildren } from 'react';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import {
  SQLiteProvider as ExpoSQLiteProvider,
  type SQLiteDatabase,
  useSQLiteContext as useExpoSQLiteContext,
} from 'expo-sqlite';

import { EmptyState } from '@/src/components/common/EmptyState';
import { AppColors } from '@/src/constants/colors';
import { initializeDatabase } from '@/src/db/database';

export function AppDatabaseProvider({ children }: PropsWithChildren) {
  const [providerError, setProviderError] = useState<string | null>(null);
  const [providerKey, setProviderKey] = useState(0);

  if (providerError) {
    return (
      <View style={styles.container}>
        <EmptyState
          title="Không khởi tạo được dữ liệu FlexShift"
          description={`${providerError}\n\nHãy thử nạp lại dữ liệu trên thiết bị để tiếp tục.`}
          actionLabel="Thử lại"
          onAction={() => {
            setProviderError(null);
            setProviderKey((current) => current + 1);
          }}
        />
      </View>
    );
  }

  return (
    <ExpoSQLiteProvider
      key={providerKey}
      databaseName="flexshift-mobile.db"
      onError={(error) => setProviderError(error.message)}
      onInit={initializeDatabase}
    >
      {children}
    </ExpoSQLiteProvider>
  );
}

export function useSQLiteContext() {
  return useExpoSQLiteContext();
}

export type { SQLiteDatabase };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    backgroundColor: AppColors.background,
  },
});
