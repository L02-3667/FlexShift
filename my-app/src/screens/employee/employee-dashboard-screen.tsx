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
import { BRANDING } from '@/src/constants/branding';
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <View style={styles.heroHeader}>
            <View style={styles.heroCopy}>
              <Text style={styles.kicker}>Không gian nhân viên</Text>
              <Text style={styles.title}>{currentUser.fullName}</Text>
              <Text style={styles.description}>
                Xem lịch tuần, nhận ca phù hợp và theo dõi yêu cầu đang xử lý
                trong một nhịp thao tác gọn và đáng tin hơn.
              </Text>
            </View>

            <View style={styles.heroBadge}>
              <Text style={styles.heroBadgeValue}>{data.weekShiftCount}</Text>
              <Text style={styles.heroBadgeLabel}>ca tuan nay</Text>
            </View>
          </View>

          <View style={styles.heroChipRow}>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>{BRANDING.appName}</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>Hàng đợi offline</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>Nhận ca nhanh</Text>
            </View>
          </View>
        </View>

        <SyncStatusBanner />

        <View style={styles.metricRow}>
          <MetricCard
            label="Ca tuần này"
            value={data.weekShiftCount}
            tone="primary"
          />
          <MetricCard
            label="Ca cần bạn"
            value={data.openShiftCount}
            tone="warning"
          />
        </View>

        <MetricCard
          label="Yêu cầu chờ duyệt"
          value={data.pendingRequestCount}
          tone={data.pendingRequestCount > 0 ? 'warning' : 'neutral'}
        />

        <View style={styles.actionRow}>
          <PrimaryButton
            label="Xem lịch tuần này"
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
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton
            label="Ca cần bạn"
            onPress={() =>
              router.push('/(employee)/(tabs)/open-shifts' as Href)
            }
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Xem số liệu"
            onPress={() => router.push('/(employee)/(tabs)/statistics' as Href)}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <SectionHeader
          title="Ca sắp tới"
          subtitle="Các ca đã chốt gần nhất luôn bám theo lịch thực tế của bạn."
          actionLabel="Xin nghỉ ca"
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
            title="Chưa có ca nào sắp tới"
            description="Bạn chưa có ca đã chốt trong thời gian gần. Hãy mở danh sách ca cần người để nhận thêm khi phù hợp."
            actionLabel="Mở ca cần bạn"
            onAction={() =>
              router.push('/(employee)/(tabs)/open-shifts' as Href)
            }
          />
        ) : (
          data.upcomingShifts.map((shift) => (
            <ShiftCard key={shift.id} shift={shift} />
          ))
        )}

        <SectionHeader
          title="Cập nhật mới nhất"
          subtitle="Mọi thay đổi quan trọng đều quay về một luồng cập nhật ngắn gọn, dễ đọc."
        />

        {data.recentUpdates.length === 0 ? (
          <EmptyState
            title="Chưa có cập nhật mới"
            description="Khi lịch thay đổi hoặc yêu cầu được xử lý, mục này sẽ tự động hiển thị."
          />
        ) : (
          data.recentUpdates.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))
        )}

        <SectionHeader
          title="Thông báo vận hành"
          subtitle="Thông báo cần xác nhận sẽ không bị trôi như chat rời."
        />

        {data.announcements.length === 0 ? (
          <EmptyState
            title="Chưa có thông báo mới"
            description="Thông báo từ quản lý và cập nhật cần xác nhận sẽ hiện tại đây."
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
                            : 'Trạng thái xác nhận sẽ tự động gửi khi kết nối ổn định.',
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
    padding: spacingTokens.xl,
    gap: spacingTokens.lg + spacingTokens.xxs,
    paddingBottom: spacingTokens.xxxl + spacingTokens.xxs,
  },
  hero: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.hero,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl + spacingTokens.xxs,
    gap: spacingTokens.md,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 14,
    },
    shadowRadius: 24,
    elevation: 3,
  },
  heroHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacingTokens.md,
  },
  heroCopy: {
    flex: 1,
    gap: spacingTokens.xs,
  },
  kicker: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.8,
  },
  description: {
    fontSize: typographyTokens.bodyLg,
    lineHeight: typographyTokens.lineHeightLg,
    color: AppColors.textSecondary,
  },
  heroBadge: {
    minWidth: 96,
    borderRadius: radiusTokens.xl,
    backgroundColor: AppColors.primary,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacingTokens.xxs,
  },
  heroBadgeValue: {
    fontSize: 32,
    fontWeight: '800',
    color: AppColors.accent,
    letterSpacing: -1,
  },
  heroBadgeLabel: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.accent,
    textTransform: 'uppercase',
    textAlign: 'center',
  },
  heroChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacingTokens.sm,
  },
  heroChip: {
    borderRadius: radiusTokens.pill,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 1,
    borderColor: AppColors.border,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
  },
  heroChipText: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.accent,
  },
  metricRow: {
    flexDirection: 'row',
    gap: spacingTokens.md,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacingTokens.md,
  },
  actionButton: {
    flex: 1,
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.xl + spacingTokens.xxs,
    alignItems: 'center',
    gap: spacingTokens.sm + spacingTokens.xxs,
  },
  stateText: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
});
