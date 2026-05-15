import { router, type Href } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ActivityCard } from '@/src/components/cards/ActivityCard';
import { AnnouncementCard } from '@/src/components/cards/AnnouncementCard';
import { ShiftCard } from '@/src/components/cards/ShiftCard';
import { EmptyState } from '@/src/components/common/EmptyState';
import { MetricCard } from '@/src/components/common/MetricCard';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { AppColors } from '@/src/constants/colors';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import { acknowledgeAnnouncementAction } from '@/src/services/flexshift-actions';
import { getEmployeeDashboardData } from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

type EmployeeDashboardSnapshot = Awaited<
  ReturnType<typeof getEmployeeDashboardData>
>;

const initialDashboard: EmployeeDashboardSnapshot = {
  upcomingShifts: [],
  openShiftCount: 0,
  pendingRequestCount: 0,
  weekShiftCount: 0,
  recentUpdates: [],
  announcements: [],
};

export function EmployeeDashboardScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshToken } = useAppState();

  const { data, error, loading, reload } = useAsyncData(
    () => getEmployeeDashboardData(db, currentUser?.id ?? ''),
    [db, currentUser?.id, refreshToken],
    initialDashboard,
  );

  if (!currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="employee-dashboard-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Hôm nay</Text>
            <Text style={styles.title}>{currentUser.fullName}</Text>
          </View>

          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{data.weekShiftCount}</Text>
            <Text style={styles.summaryLabel}>ca tuần này</Text>
          </View>
        </View>

        <SyncStatusBanner />

        <View style={styles.metricRow}>
          <MetricCard
            label="Ca tuần này"
            value={data.weekShiftCount}
            tone="primary"
            compact
          />
          <MetricCard
            label="Ca trống"
            value={data.openShiftCount}
            tone="warning"
            compact
          />
        </View>

        <MetricCard
          label="Yêu cầu chờ duyệt"
          value={data.pendingRequestCount}
          tone={data.pendingRequestCount > 0 ? 'warning' : 'neutral'}
          compact
        />

        <View style={styles.actionPanel}>
          <PrimaryButton
            label="Xem lịch"
            onPress={() => router.push('/(employee)/(tabs)/calendar' as Href)}
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Nhường ca"
            onPress={() =>
              router.push('/(employee)/requests/create-yield' as Href)
            }
            variant="secondary"
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Ca trống"
            onPress={() =>
              router.push('/(employee)/(tabs)/open-shifts' as Href)
            }
            variant="secondary"
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Số liệu"
            onPress={() => router.push('/(employee)/(tabs)/statistics' as Href)}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <SectionHeader
          title="Ca sắp tới"
          actionLabel="Xin nghỉ"
          onActionPress={() =>
            router.push('/(employee)/requests/create-leave' as Href)
          }
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Đang tải trang chủ...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Không tải được trang chủ"
            description={error}
            actionLabel="Thử lại"
            onAction={reload}
          />
        ) : data.upcomingShifts.length === 0 ? (
          <EmptyState
            title="Chưa có ca sắp tới"
            description="Bạn chưa có ca đã chốt trong thời gian gần."
            actionLabel="Mở ca trống"
            onAction={() =>
              router.push('/(employee)/(tabs)/open-shifts' as Href)
            }
          />
        ) : (
          data.upcomingShifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))
        )}

        <SectionHeader title="Cập nhật mới" />

        {data.recentUpdates.length === 0 ? (
          <EmptyState
            title="Chưa có cập nhật mới"
            description="Thay đổi lịch và yêu cầu sẽ hiển thị tại đây."
          />
        ) : (
          data.recentUpdates.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))
        )}

        <SectionHeader title="Thông báo" />

        {data.announcements.length === 0 ? (
          <EmptyState
            title="Chưa có thông báo mới"
            description="Thông báo từ quản lý sẽ hiển thị tại đây."
          />
        ) : (
          data.announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              item={announcement}
              onAcknowledge={
                announcement.requiresAck && !announcement.acknowledgedAt
                  ? async () => {
                      try {
                        const result = await acknowledgeAnnouncementAction(
                          db,
                          announcement.id,
                        );
                        await reload();
                        Alert.alert(
                          result.delivery === 'sent'
                            ? 'Đã xác nhận thông báo'
                            : 'Đã đưa vào hàng đợi',
                          result.delivery === 'sent'
                            ? 'Trạng thái xác nhận đã được đồng bộ.'
                            : 'Trạng thái xác nhận sẽ tự động gửi khi có kết nối ổn định.',
                        );
                      } catch (error) {
                        Alert.alert(
                          'Không thể xác nhận',
                          error instanceof Error
                            ? error.message
                            : 'Vui lòng thử lại.',
                        );
                      }
                    }
                  : undefined
              }
            />
          ))
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
    padding: spacingTokens.lg,
    gap: spacingTokens.md,
    paddingBottom: spacingTokens.xxxl + spacingTokens.xxs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
  },
  headerCopy: {
    flex: 1,
    gap: spacingTokens.xs,
  },
  kicker: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: {
    fontSize: typographyTokens.titleLg,
    lineHeight: 28,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: 0,
  },
  summaryPill: {
    minWidth: 88,
    borderRadius: radiusTokens.lg,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingTokens.xxs,
  },
  summaryValue: {
    fontSize: 26,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: 0,
  },
  summaryLabel: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.textSecondary,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacingTokens.md,
  },
  actionPanel: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingTokens.md,
  },
  actionButton: {
    flexGrow: 1,
    flexBasis: '47%',
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl,
    alignItems: 'center',
    gap: spacingTokens.md,
  },
  stateText: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
});
