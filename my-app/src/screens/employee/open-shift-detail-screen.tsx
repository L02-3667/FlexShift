import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OpenShiftCard } from '@/src/components/cards/OpenShiftCard';
import { EmptyState } from '@/src/components/common/EmptyState';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import { claimOpenShiftAction } from '@/src/services/flexshift-actions';
import { getOpenShiftDetailData } from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

export function OpenShiftDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, refreshData, refreshToken } = useAppState();
  const [submitting, setSubmitting] = useState(false);

  const { data, error, loading, reload } = useAsyncData(
    () => getOpenShiftDetailData(db, id),
    [db, id, refreshToken],
    null,
  );

  if (!currentUser) {
    return null;
  }

  const onClaim = async () => {
    if (!id) {
      return;
    }

    try {
      setSubmitting(true);
      const result = await claimOpenShiftAction(db, id, currentUser.id);
      await refreshData();
      Alert.alert(
        result.delivery === 'sent'
          ? APP_COPY.openShiftDetail.claimedTitle
          : APP_COPY.openShiftDetail.queuedTitle,
        result.delivery === 'sent'
          ? APP_COPY.openShiftDetail.claimedDescription
          : APP_COPY.openShiftDetail.queuedDescription,
      );
      router.replace('/(employee)/(tabs)/open-shifts');
    } catch (claimError) {
      Alert.alert(
        APP_COPY.openShiftDetail.claimFailedTitle,
        claimError instanceof Error
          ? claimError.message
          : APP_COPY.common.tryAgain,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID="employee-open-shift-detail-screen"
    >
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title={APP_COPY.openShiftDetail.title}
          subtitle={APP_COPY.openShiftDetail.subtitle}
        />

        <SyncStatusBanner />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>
              {APP_COPY.openShiftDetail.loading}
            </Text>
          </View>
        ) : error ? (
          <EmptyState
            title={APP_COPY.openShiftDetail.loadFailedTitle}
            description={error}
            actionLabel={APP_COPY.common.retry}
            onAction={reload}
          />
        ) : !data ? (
          <EmptyState
            title={APP_COPY.openShiftDetail.missingTitle}
            description={APP_COPY.openShiftDetail.missingDescription}
            actionLabel={APP_COPY.common.backToList}
            onAction={() => router.back()}
          />
        ) : (
          <>
            <OpenShiftCard openShift={data} />

            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>
                {APP_COPY.openShiftDetail.rulesTitle}
              </Text>
              {APP_COPY.openShiftDetail.rules.map((rule, index) => (
                <Text key={rule} style={styles.infoText}>
                  {index + 1}. {rule}
                </Text>
              ))}
            </View>

            <PrimaryButton
              label={
                data.status === 'open'
                  ? APP_COPY.openShiftDetail.claimAction
                  : APP_COPY.openShiftDetail.unavailableAction
              }
              onPress={onClaim}
              disabled={data.status !== 'open'}
              loading={submitting}
            />
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
  infoCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.xxs,
    gap: spacingTokens.sm + spacingTokens.xxs,
  },
  infoTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  infoText: {
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.textSecondary,
  },
});
