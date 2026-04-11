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
              <Text style={styles.kicker}>Employee space</Text>
              <Text style={styles.title}>{currentUser.fullName}</Text>
              <Text style={styles.description}>
                Xem lich tuan, nhan ca phu hop va theo doi yeu cau dang xu ly
                trong mot nhip thao tac gon va dang tin hon.
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
              <Text style={styles.heroChipText}>Offline queue</Text>
            </View>
            <View style={styles.heroChip}>
              <Text style={styles.heroChipText}>Fast claim</Text>
            </View>
          </View>
        </View>

        <SyncStatusBanner />

        <View style={styles.metricRow}>
          <MetricCard
            label="Ca tuan nay"
            value={data.weekShiftCount}
            tone="primary"
          />
          <MetricCard
            label="Ca can ban"
            value={data.openShiftCount}
            tone="warning"
          />
        </View>

        <MetricCard
          label="Yeu cau cho duyet"
          value={data.pendingRequestCount}
          tone={data.pendingRequestCount > 0 ? 'warning' : 'neutral'}
        />

        <View style={styles.actionRow}>
          <PrimaryButton
            label="Xem lich tuan nay"
            onPress={() => router.push('/(employee)/(tabs)/calendar' as Href)}
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Nhuong ca"
            onPress={() =>
              router.push('/(employee)/requests/create-yield' as Href)
            }
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton
            label="Ca can ban"
            onPress={() =>
              router.push('/(employee)/(tabs)/open-shifts' as Href)
            }
            style={styles.actionButton}
          />
          <PrimaryButton
            label="Xem so lieu"
            onPress={() => router.push('/(employee)/(tabs)/statistics' as Href)}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <SectionHeader
          title="Ca sap toi"
          subtitle="Cac ca da chot gan nhat luon bam theo lich thuc te cua ban."
          actionLabel="Xin nghi ca"
          onActionPress={() =>
            router.push('/(employee)/requests/create-leave' as Href)
          }
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Dang tai trang chu...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Khong tai duoc trang chu"
            description={error}
            actionLabel="Thu lai"
            onAction={reload}
          />
        ) : data.upcomingShifts.length === 0 ? (
          <EmptyState
            title="Chua co ca nao sap toi"
            description="Ban chua co ca da chot trong thoi gian gan. Hay mo danh sach ca can nguoi de nhan them khi phu hop."
            actionLabel="Mo ca can ban"
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
          title="Cap nhat moi nhat"
          subtitle="Moi thay doi quan trong deu quay ve mot luong cap nhat ngan gon, de doc."
        />

        {data.recentUpdates.length === 0 ? (
          <EmptyState
            title="Chua co cap nhat moi"
            description="Khi lich thay doi hoac yeu cau duoc xu ly, muc nay se tu dong hien thi."
          />
        ) : (
          data.recentUpdates.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))
        )}

        <SectionHeader
          title="Thong bao van hanh"
          subtitle="Thong bao can xac nhan se khong bi troi nhu chat roi."
        />

        {data.announcements.length === 0 ? (
          <EmptyState
            title="Chua co thong bao moi"
            description="Thong bao tu quan ly va cap nhat can xac nhan se hien tai day."
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
                            ? 'Da xac nhan thong bao'
                            : 'Da dua vao hang doi',
                          result.delivery === 'sent'
                            ? 'Trang thai xac nhan da duoc dong bo.'
                            : 'Trang thai xac nhan se tu dong gui khi ket noi on dinh.',
                        );
                      } catch (error) {
                        Alert.alert(
                          'Khong the xac nhan',
                          error instanceof Error
                            ? error.message
                            : 'Vui long thu lai.',
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
