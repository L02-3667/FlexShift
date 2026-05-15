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
import { RequestCard } from '@/src/components/cards/RequestCard';
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
import { getManagerDashboardData } from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

type ManagerDashboardSnapshot = Awaited<
  ReturnType<typeof getManagerDashboardData>
>;

const initialDashboard: ManagerDashboardSnapshot = {
  pendingRequests: [],
  openShiftCount: 0,
  confirmedShiftCount: 0,
  pendingCount: 0,
  recentUpdates: [],
  announcements: [],
};

export function ManagerDashboardScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshToken } = useAppState();

  const { data, error, loading, reload } = useAsyncData(
    () => getManagerDashboardData(db),
    [db, currentUser?.id, refreshToken],
    initialDashboard,
  );

  if (!currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} testID="manager-dashboard-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>Tổng quan</Text>
            <Text style={styles.title}>Điều phối ca</Text>
          </View>

          <View style={styles.summaryPill}>
            <Text style={styles.summaryValue}>{data.pendingCount}</Text>
            <Text style={styles.summaryLabel}>chờ duyệt</Text>
          </View>
        </View>

        <SyncStatusBanner />

        <View style={styles.metricRow}>
          <MetricCard
            label="Chờ duyệt"
            value={data.pendingCount}
            tone="warning"
            compact
          />
          <MetricCard
            label="Ca đang mở"
            value={data.openShiftCount}
            tone="primary"
            compact
          />
        </View>

        <MetricCard
          label="Ca đã chốt"
          value={data.confirmedShiftCount}
          tone="neutral"
          compact
        />

        <View style={styles.actionPanel}>
          <PrimaryButton
            label="Mở lịch"
            onPress={() => router.push('/(manager)/(tabs)/calendar' as Href)}
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Tạo ca trống"
            onPress={() =>
              router.push('/(manager)/(tabs)/create-open-shift' as Href)
            }
            variant="secondary"
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Duyệt ca"
            onPress={() => router.push('/(manager)/(tabs)/approvals' as Href)}
            variant="secondary"
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Số liệu"
            onPress={() => router.push('/(manager)/(tabs)/statistics' as Href)}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <SectionHeader
          title="Yêu cầu cần xử lý"
          actionLabel="Mở danh sách"
          onActionPress={() =>
            router.push('/(manager)/(tabs)/approvals' as Href)
          }
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Đang tải tổng quan...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Không tải được tổng quan"
            description={error}
            actionLabel="Thử lại"
            onAction={reload}
          />
        ) : data.pendingRequests.length === 0 ? (
          <EmptyState
            title="Không có yêu cầu đang chờ"
            description="Lịch hiện chưa có yêu cầu cần xử lý."
            actionLabel="Mở lịch"
            onAction={() => router.push('/(manager)/(tabs)/calendar' as Href)}
          />
        ) : (
          data.pendingRequests.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              showRequester
              onPress={() =>
                router.push({
                  pathname: '/(manager)/approvals/[id]',
                  params: { id: request.id },
                })
              }
            />
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
            description="Thông báo vận hành sẽ hiển thị tại đây."
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
