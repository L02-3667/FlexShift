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
import { BRANDING } from '@/src/constants/branding';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
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
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.hero}>
          <Text style={styles.kicker}>{BRANDING.slogan}</Text>
          <Text style={styles.title}>{APP_COPY.managerDashboard.title}</Text>
          <Text style={styles.description}>
            {APP_COPY.managerDashboard.description}
          </Text>
        </View>

        <SyncStatusBanner />

        <View style={styles.metricRow}>
          <MetricCard
            label="Yeu cau cho duyet"
            value={data.pendingCount}
            tone="warning"
          />
          <MetricCard
            label="Ca dang mo"
            value={data.openShiftCount}
            tone="primary"
          />
        </View>

        <MetricCard
          label="Ca da chot"
          value={data.confirmedShiftCount}
          tone="neutral"
        />

        <View style={styles.actionRow}>
          <PrimaryButton
            label={APP_COPY.managerDashboard.openScheduleAction}
            onPress={() => router.push('/(manager)/(tabs)/calendar' as Href)}
            style={styles.actionButton}
          />
          <PrimaryButton
            label={APP_COPY.managerDashboard.createOpenShiftAction}
            onPress={() =>
              router.push('/(manager)/(tabs)/create-open-shift' as Href)
            }
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <View style={styles.actionRow}>
          <PrimaryButton
            label={APP_COPY.managerDashboard.openApprovalsAction}
            onPress={() => router.push('/(manager)/(tabs)/approvals' as Href)}
            style={styles.actionButton}
          />
          <PrimaryButton
            label={APP_COPY.managerDashboard.openStatisticsAction}
            onPress={() => router.push('/(manager)/(tabs)/statistics' as Href)}
            variant="secondary"
            style={styles.actionButton}
          />
        </View>

        <SectionHeader
          title={APP_COPY.managerDashboard.pendingTitle}
          subtitle={APP_COPY.managerDashboard.pendingSubtitle}
          actionLabel="Mo danh sach"
          onActionPress={() =>
            router.push('/(manager)/(tabs)/approvals' as Href)
          }
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>
              {APP_COPY.managerDashboard.loading}
            </Text>
          </View>
        ) : error ? (
          <EmptyState
            title={APP_COPY.managerDashboard.loadFailedTitle}
            description={error}
            actionLabel={APP_COPY.common.retry}
            onAction={reload}
          />
        ) : data.pendingRequests.length === 0 ? (
          <EmptyState
            title={APP_COPY.managerDashboard.noPendingTitle}
            description={APP_COPY.managerDashboard.noPendingDescription}
            actionLabel={APP_COPY.managerDashboard.openScheduleAction}
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

        <SectionHeader
          title={APP_COPY.managerDashboard.recentTitle}
          subtitle={APP_COPY.managerDashboard.recentSubtitle}
        />

        {data.recentUpdates.length === 0 ? (
          <EmptyState
            title={APP_COPY.managerDashboard.noUpdatesTitle}
            description={APP_COPY.managerDashboard.noUpdatesDescription}
          />
        ) : (
          data.recentUpdates.map((item) => (
            <ActivityCard key={item.id} item={item} />
          ))
        )}

        <SectionHeader
          title={APP_COPY.managerDashboard.announcementsTitle}
          subtitle={APP_COPY.managerDashboard.announcementsSubtitle}
        />

        {data.announcements.length === 0 ? (
          <EmptyState
            title={APP_COPY.managerDashboard.noAnnouncementsTitle}
            description={APP_COPY.managerDashboard.noAnnouncementsDescription}
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
                            ? APP_COPY.managerDashboard.acknowledgeSentTitle
                            : APP_COPY.managerDashboard.acknowledgeQueuedTitle,
                          result.delivery === 'sent'
                            ? APP_COPY.managerDashboard
                                .acknowledgeSentDescription
                            : APP_COPY.managerDashboard
                                .acknowledgeQueuedDescription,
                        );
                      } catch (error) {
                        Alert.alert(
                          APP_COPY.managerDashboard.acknowledgeFailedTitle,
                          error instanceof Error
                            ? error.message
                            : APP_COPY.common.tryAgain,
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
    gap: spacingTokens.xs,
  },
  kicker: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.primary,
  },
  title: {
    fontSize: typographyTokens.headline,
    fontWeight: '800',
    color: AppColors.text,
  },
  description: {
    fontSize: typographyTokens.bodyLg,
    lineHeight: typographyTokens.lineHeightLg,
    color: AppColors.textSecondary,
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
