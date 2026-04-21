import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmptyState } from '@/src/components/common/EmptyState';
import { MetricCard } from '@/src/components/common/MetricCard';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import {
  getManagerStatisticsData,
  type ManagerStatisticsData,
} from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

const initialStatistics: ManagerStatisticsData = {
  openShiftCount: 0,
  pendingRequestCount: 0,
  fillRate: 0,
  confirmedShiftCount: 0,
  approvedRequestCount: 0,
  rejectedRequestCount: 0,
  allocatedHoursThisWeek: 0,
  storeBreakdown: [],
};

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export function ManagerStatisticsScreen() {
  const db = useSQLiteContext();
  const { refreshToken } = useAppState();

  const { data, error, loading, reload } = useAsyncData(
    () => getManagerStatisticsData(db),
    [db, refreshToken],
    initialStatistics,
  );

  return (
    <SafeAreaView style={styles.safeArea} testID="manager-statistics-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Thống kê vận hành"
          subtitle="Tập trung vào độ phủ ca, số yêu cầu chờ xử lý và khối lượng giờ đã phân bổ để ra quyết định nhanh."
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Đang tải thống kê vận hành...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Không tải được thống kê"
            description={error}
            actionLabel={APP_COPY.common.retry}
            onAction={reload}
          />
        ) : (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                label="Ca đang mở"
                value={data.openShiftCount}
                tone="warning"
              />
              <MetricCard
                label="Yêu cầu chờ duyệt"
                value={data.pendingRequestCount}
                tone="primary"
              />
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                label="Tỷ lệ lấp ca"
                value={`${data.fillRate}%`}
                tone="primary"
              />
              <MetricCard
                label="Ca đã chốt"
                value={data.confirmedShiftCount}
                tone="neutral"
              />
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                label="Giờ đã phân bổ"
                value={formatHours(data.allocatedHoursThisWeek)}
                tone="neutral"
              />
              <MetricCard
                label="Duyệt / từ chối"
                value={`${data.approvedRequestCount} / ${data.rejectedRequestCount}`}
                tone="neutral"
              />
            </View>

            <View style={styles.breakdownCard}>
              <Text style={styles.breakdownTitle}>Theo cửa hàng</Text>
              {data.storeBreakdown.map((store) => (
                <View key={store.storeName} style={styles.breakdownRow}>
                  <View style={styles.breakdownTextBlock}>
                    <Text style={styles.breakdownName}>{store.storeName}</Text>
                    <Text style={styles.breakdownMeta}>
                      {store.confirmedShiftCount} ca đã chốt,{' '}
                      {store.openShiftCount} ca đang mở
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: spacingTokens.xl,
    gap: spacingTokens.lg + spacingTokens.xxs,
    paddingBottom: spacingTokens.xxxl + spacingTokens.xxs,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacingTokens.md,
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl + spacingTokens.xxs,
    gap: spacingTokens.sm + spacingTokens.xxs,
    alignItems: 'center',
  },
  stateText: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
  breakdownCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.xxs,
    gap: spacingTokens.md + spacingTokens.xxs,
  },
  breakdownTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
  },
  breakdownTextBlock: {
    flex: 1,
    gap: spacingTokens.xxs,
  },
  breakdownName: {
    fontSize: typographyTokens.bodyLg,
    fontWeight: '700',
    color: AppColors.text,
  },
  breakdownMeta: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.textSecondary,
  },
});
