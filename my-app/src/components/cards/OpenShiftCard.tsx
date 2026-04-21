import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/src/components/common/AppIcon';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { DateTimeRow } from '@/src/components/common/DateTimeRow';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { AppColors } from '@/src/constants/colors';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import type { OpenShiftView } from '@/src/types/models';
import { formatDateTimeLabel } from '@/src/utils/date';

interface OpenShiftCardProps {
  openShift: OpenShiftView;
  onPress?: () => void;
  actionLabel?: string;
  actionLoading?: boolean;
  onActionPress?: () => void;
  testID?: string;
}

export function OpenShiftCard({
  openShift,
  onPress,
  actionLabel,
  actionLoading = false,
  onActionPress,
  testID,
}: OpenShiftCardProps) {
  const details = (
    <>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{openShift.position}</Text>
          <Text style={styles.subtitle}>{openShift.storeName}</Text>
        </View>
        <StatusBadge status={openShift.status} />
      </View>

      <DateTimeRow
        date={openShift.date}
        startTime={openShift.startTime}
        endTime={openShift.endTime}
      />

      <View style={styles.noteRow}>
        <AppIcon name="note" size={16} color={AppColors.textMuted} />
        <Text style={styles.noteText}>{openShift.note}</Text>
      </View>
    </>
  );

  return (
    <View style={styles.card}>
      {onPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${openShift.position}, ${openShift.storeName}, ${formatDateTimeLabel(
            openShift.date,
            openShift.startTime,
            openShift.endTime,
          )}`}
          testID={testID}
          onPress={onPress}
          style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
        >
          {details}
        </Pressable>
      ) : (
        <View testID={testID}>{details}</View>
      )}

      {actionLabel && onActionPress ? (
        <PrimaryButton
          label={actionLabel}
          onPress={onActionPress}
          loading={actionLoading}
          style={styles.actionButton}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: AppColors.surface,
    borderRadius: radiusTokens.xxl,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: spacingTokens.lg + spacingTokens.xs,
    gap: spacingTokens.md + spacingTokens.xxs,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 18,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
  },
  headerText: {
    flex: 1,
    gap: spacingTokens.xxs,
  },
  title: {
    fontSize: typographyTokens.titleLg,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: typographyTokens.bodyLg,
    color: AppColors.textSecondary,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacingTokens.sm,
  },
  noteText: {
    flex: 1,
    fontSize: typographyTokens.body,
    lineHeight: typographyTokens.lineHeightMd,
    color: AppColors.textSecondary,
  },
  actionButton: {
    marginTop: spacingTokens.xxs,
  },
});
