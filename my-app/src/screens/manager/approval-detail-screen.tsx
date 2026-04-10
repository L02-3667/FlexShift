import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RequestCard } from '@/src/components/cards/RequestCard';
import { AppInput } from '@/src/components/common/AppInput';
import { EmptyState } from '@/src/components/common/EmptyState';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import {
  approveRequestAction,
  rejectRequestAction,
} from '@/src/services/flexshift-actions';
import { getRequestDetailData } from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import { formatIsoDateTime } from '@/src/utils/text';

export function ApprovalDetailScreen() {
  const db = useSQLiteContext();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currentUser, refreshData, refreshToken } = useAppState();
  const [managerNote, setManagerNote] = useState('');
  const [submittingAction, setSubmittingAction] = useState<
    'approve' | 'reject' | null
  >(null);

  const { data, error, loading, reload } = useAsyncData(
    () => getRequestDetailData(db, id),
    [db, id, refreshToken],
    null,
  );

  useEffect(() => {
    setManagerNote(data?.managerNote ?? '');
  }, [data?.managerNote]);

  if (!currentUser) {
    return null;
  }

  const handleApprove = async () => {
    if (!id) {
      return;
    }

    try {
      setSubmittingAction('approve');
      const result = await approveRequestAction(
        db,
        id,
        currentUser.id,
        managerNote,
      );
      await refreshData();
      Alert.alert(
        result.delivery === 'sent'
          ? APP_COPY.approvals.approvedTitle
          : APP_COPY.approvals.queuedTitle,
        result.delivery === 'sent'
          ? APP_COPY.approvals.approvedDescription
          : APP_COPY.approvals.approveQueuedDescription,
      );
      router.replace('/(manager)/(tabs)/approvals');
    } catch (approvalError) {
      Alert.alert(
        APP_COPY.approvals.approveFailedTitle,
        approvalError instanceof Error
          ? approvalError.message
          : APP_COPY.common.tryAgain,
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  const handleReject = async () => {
    if (!id) {
      return;
    }

    try {
      setSubmittingAction('reject');
      const result = await rejectRequestAction(
        db,
        id,
        currentUser.id,
        managerNote,
      );
      await refreshData();
      Alert.alert(
        result.delivery === 'sent'
          ? APP_COPY.approvals.rejectTitle
          : APP_COPY.approvals.queuedTitle,
        result.delivery === 'sent'
          ? APP_COPY.approvals.rejectDescription
          : APP_COPY.approvals.rejectQueuedDescription,
      );
      router.replace('/(manager)/(tabs)/approvals');
    } catch (rejectionError) {
      Alert.alert(
        APP_COPY.approvals.rejectFailedTitle,
        rejectionError instanceof Error
          ? rejectionError.message
          : APP_COPY.common.tryAgain,
      );
    } finally {
      setSubmittingAction(null);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title={APP_COPY.approvals.title}
          subtitle={APP_COPY.approvals.subtitle}
        />

        <SyncStatusBanner />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>{APP_COPY.approvals.loading}</Text>
          </View>
        ) : error ? (
          <EmptyState
            title={APP_COPY.approvals.loadFailedTitle}
            description={error}
            actionLabel={APP_COPY.common.retry}
            onAction={reload}
          />
        ) : !data ? (
          <EmptyState
            title={APP_COPY.approvals.missingTitle}
            description={APP_COPY.approvals.missingDescription}
            actionLabel={APP_COPY.common.backToList}
            onAction={() => router.back()}
          />
        ) : (
          <>
            <RequestCard request={data} showRequester />

            <View style={styles.detailCard}>
              <Text style={styles.detailTitle}>
                {APP_COPY.approvals.detailTitle}
              </Text>
              <Text style={styles.detailText}>
                {APP_COPY.approvals.requesterReasonLabel}: {data.reason}
              </Text>
              {data.type === 'yield' && data.targetEmployeeName ? (
                <Text style={styles.detailText}>
                  {APP_COPY.approvals.targetEmployeeLabel}:{' '}
                  {data.targetEmployeeName}
                </Text>
              ) : null}
              {data.reviewedAt ? (
                <Text style={styles.detailText}>
                  {APP_COPY.approvals.reviewedAtLabel}:{' '}
                  {formatIsoDateTime(data.reviewedAt)}
                </Text>
              ) : null}
            </View>

            {data.status === 'pending' ? (
              <>
                <AppInput
                  label={APP_COPY.approvals.managerNoteLabel}
                  hint={APP_COPY.approvals.managerNoteHint}
                  multiline
                  value={managerNote}
                  onChangeText={setManagerNote}
                />

                <View style={styles.actionRow}>
                  <PrimaryButton
                    label={APP_COPY.approvals.approveAction}
                    onPress={handleApprove}
                    loading={submittingAction === 'approve'}
                    style={styles.actionButton}
                  />
                  <PrimaryButton
                    label={APP_COPY.approvals.rejectAction}
                    onPress={handleReject}
                    variant="danger"
                    loading={submittingAction === 'reject'}
                    style={styles.actionButton}
                  />
                </View>
              </>
            ) : (
              <View style={styles.statusBox}>
                <Text style={styles.statusTitle}>
                  {APP_COPY.approvals.reviewedTitle}
                </Text>
                <Text style={styles.statusText}>
                  {APP_COPY.approvals.reviewedStatusLabel}:{' '}
                  {data.status === 'approved'
                    ? APP_COPY.approvals.approvedStatus
                    : APP_COPY.approvals.rejectedStatus}
                </Text>
                <Text style={styles.statusText}>
                  {APP_COPY.approvals.managerNoteLabel}:{' '}
                  {data.managerNote?.trim()
                    ? data.managerNote
                    : APP_COPY.common.noManagerNote}
                </Text>
              </View>
            )}
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
    alignItems: 'center',
    gap: spacingTokens.sm + spacingTokens.xxs,
  },
  stateText: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
  detailCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.xxs,
    gap: spacingTokens.sm + spacingTokens.xxs,
  },
  detailTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  detailText: {
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.textSecondary,
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacingTokens.md,
  },
  actionButton: {
    flex: 1,
  },
  statusBox: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.xxs,
    gap: spacingTokens.sm,
  },
  statusTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  statusText: {
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.textSecondary,
  },
});
