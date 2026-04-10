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
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import {
  getEmployeeStatisticsData,
  type EmployeeStatisticsData,
} from '@/src/services/flexshift-service';

const initialStatistics: EmployeeStatisticsData = {
  shiftCountThisWeek: 0,
  hoursThisWeek: 0,
  hoursThisMonth: 0,
  pendingRequestCount: 0,
  completedShiftCount: 0,
  approvalRate: 0,
};

function formatHours(value: number) {
  return `${value.toFixed(1)}h`;
}

export function EmployeeStatisticsScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshToken } = useAppState();

  const { data, error, loading, reload } = useAsyncData(
    () => getEmployeeStatisticsData(db, currentUser?.id ?? ''),
    [db, currentUser?.id, refreshToken],
    initialStatistics,
  );

  if (!currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Thống kê của bạn"
          subtitle="Nhìn nhanh khối lượng ca, số giờ làm và tiến độ xử lý yêu cầu để chủ động hơn mỗi tuần."
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Đang tải thống kê...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Không tải được thống kê"
            description={error}
            actionLabel="Thử lại"
            onAction={reload}
          />
        ) : (
          <>
            <View style={styles.metricRow}>
              <MetricCard
                label="Ca tuần này"
                value={data.shiftCountThisWeek}
                tone="primary"
              />
              <MetricCard
                label="Giờ tuần này"
                value={formatHours(data.hoursThisWeek)}
                tone="warning"
              />
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                label="Giờ tháng này"
                value={formatHours(data.hoursThisMonth)}
                tone="neutral"
              />
              <MetricCard
                label="Chờ duyệt"
                value={data.pendingRequestCount}
                tone={data.pendingRequestCount > 0 ? 'warning' : 'neutral'}
              />
            </View>

            <View style={styles.metricRow}>
              <MetricCard
                label="Ca đã hoàn thành"
                value={data.completedShiftCount}
                tone="neutral"
              />
              <MetricCard
                label="Tỷ lệ được duyệt"
                value={`${data.approvalRate}%`}
                tone="primary"
              />
            </View>

            <View style={styles.insightCard}>
              <Text style={styles.insightTitle}>Nhịp làm việc</Text>
              <Text style={styles.insightText}>
                {data.shiftCountThisWeek > 0
                  ? `Tuần này bạn đang có ${data.shiftCountThisWeek} ca với tổng ${formatHours(data.hoursThisWeek)} đã chốt.`
                  : 'Tuần này bạn chưa có ca nào được chốt. Hãy theo dõi danh sách ca cần người để nhận thêm khi phù hợp.'}
              </Text>
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
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
  insightCard: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 18,
    gap: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: AppColors.text,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 21,
    color: AppColors.textSecondary,
  },
});
