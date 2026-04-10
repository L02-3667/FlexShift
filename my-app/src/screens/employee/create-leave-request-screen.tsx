import { router } from 'expo-router';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput } from '@/src/components/common/AppInput';
import { EmptyState } from '@/src/components/common/EmptyState';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { useAppState } from '@/src/hooks/use-app-state';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { createLeaveRequestAction } from '@/src/services/flexshift-actions';
import { getEmployeeRequestFormData } from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import { formatDateTimeLabel } from '@/src/utils/date';
import { validateReason } from '@/src/utils/validation';

export function CreateLeaveRequestScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshData, refreshToken } = useAppState();
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const { data, error, loading, reload } = useAsyncData(
    () => getEmployeeRequestFormData(db, currentUser?.id ?? ''),
    [db, currentUser?.id, refreshToken],
    { upcomingShifts: [], coworkers: [] },
  );

  if (!currentUser) {
    return null;
  }

  const selectableShifts = data.upcomingShifts.filter(
    (shift) => shift.status === 'scheduled',
  );

  const onSubmit = async () => {
    const reasonError = validateReason(reason);

    if (!selectedShiftId) {
      setFormError(APP_COPY.leaveRequest.missingShift);
      return;
    }

    if (reasonError) {
      setFormError(reasonError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const result = await createLeaveRequestAction(db, {
        createdByEmployeeId: currentUser.id,
        shiftId: selectedShiftId,
        reason,
      });
      await refreshData();
      Alert.alert(
        result.delivery === 'sent'
          ? APP_COPY.leaveRequest.sentTitle
          : APP_COPY.leaveRequest.queuedTitle,
        result.delivery === 'sent'
          ? APP_COPY.leaveRequest.sentDescription
          : APP_COPY.leaveRequest.queuedDescription,
      );
      router.back();
    } catch (submitError) {
      setFormError(
        submitError instanceof Error
          ? submitError.message
          : APP_COPY.leaveRequest.failed,
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <SectionHeader
            title={APP_COPY.leaveRequest.title}
            subtitle={APP_COPY.leaveRequest.subtitle}
          />

          <SyncStatusBanner />

          {loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.stateText}>
                {APP_COPY.leaveRequest.loading}
              </Text>
            </View>
          ) : error ? (
            <EmptyState
              title={APP_COPY.leaveRequest.loadFailedTitle}
              description={error}
              actionLabel={APP_COPY.common.retry}
              onAction={reload}
            />
          ) : selectableShifts.length === 0 ? (
            <EmptyState
              title={APP_COPY.leaveRequest.emptyTitle}
              description={APP_COPY.leaveRequest.emptyDescription}
              actionLabel={APP_COPY.leaveRequest.emptyAction}
              onAction={() => router.replace('/(employee)/(tabs)/requests')}
            />
          ) : (
            <>
              <View style={styles.selectionGroup}>
                <Text style={styles.groupTitle}>
                  {APP_COPY.leaveRequest.shiftSectionTitle}
                </Text>
                {selectableShifts.map((shift) => {
                  const selected = shift.id === selectedShiftId;

                  return (
                    <Pressable
                      key={shift.id}
                      onPress={() => setSelectedShiftId(shift.id)}
                      style={[
                        styles.selectCard,
                        selected ? styles.selectCardActive : null,
                      ]}
                    >
                      <Text style={styles.selectTitle}>{shift.position}</Text>
                      <Text style={styles.selectSubtitle}>
                        {shift.storeName}
                      </Text>
                      <Text style={styles.selectMeta}>
                        {formatDateTimeLabel(
                          shift.date,
                          shift.startTime,
                          shift.endTime,
                        )}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <AppInput
                label={APP_COPY.leaveRequest.reasonLabel}
                hint={APP_COPY.leaveRequest.reasonHint}
                multiline
                value={reason}
                onChangeText={setReason}
              />

              {formError ? (
                <Text style={styles.errorText}>{formError}</Text>
              ) : null}

              <PrimaryButton
                label={APP_COPY.leaveRequest.submitAction}
                onPress={onSubmit}
                loading={submitting}
              />
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
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
  selectionGroup: {
    gap: spacingTokens.md,
  },
  groupTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  selectCard: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg,
    gap: spacingTokens.xs,
  },
  selectCardActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.backgroundAccent,
  },
  selectTitle: {
    fontSize: typographyTokens.titleSm,
    fontWeight: '700',
    color: AppColors.text,
  },
  selectSubtitle: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
  selectMeta: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.textMuted,
  },
  errorText: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.danger,
  },
});
