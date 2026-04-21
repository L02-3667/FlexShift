import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppColors } from '@/src/constants/colors';
import { BRANDING } from '@/src/constants/branding';

export function AppDatabaseProvider({ children }: PropsWithChildren) {
  void children;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.kicker}>{BRANDING.shortName}</Text>
        <Text style={styles.title}>Bản web chưa bật lớp dữ liệu cục bộ</Text>
        <Text style={styles.description}>
          {BRANDING.appName} hiện ưu tiên trải nghiệm trên Android và iOS để giữ
          luồng lịch, duyệt ca và lưu dữ liệu ổn định hơn.
        </Text>
        <Text style={styles.note}>
          Hãy mở ứng dụng bằng development build hoặc thiết bị di động để kiểm
          tra đầy đủ lịch điều phối và các thao tác nhận ca.
        </Text>
      </View>
    </SafeAreaView>
  );
}

export function useSQLiteContext() {
  throw new Error('Lớp dữ liệu cục bộ hiện chưa bật trên web.');
}

export type SQLiteDatabase = unknown;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 24,
    gap: 12,
  },
  kicker: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.primary,
  },
  title: {
    fontSize: 26,
    lineHeight: 34,
    fontWeight: '800',
    color: AppColors.text,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: AppColors.textSecondary,
  },
  note: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textMuted,
  },
});
