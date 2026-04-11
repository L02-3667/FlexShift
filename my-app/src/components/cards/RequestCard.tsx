import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/src/components/common/AppIcon';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import { REQUEST_TYPE_LABELS } from '@/src/constants/options';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import type { RequestView } from '@/src/types/models';
import { formatDateTimeLabel } from '@/src/utils/date';
import { joinInlineText } from '@/src/utils/text';

interface RequestCardProps {
  request: RequestView;
  onPress?: () => void;
  showRequester?: boolean;
}

export function RequestCard({
  request,
  onPress,
  showRequester = false,
}: RequestCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{REQUEST_TYPE_LABELS[request.type]}</Text>
          <Text style={styles.subtitle}>
            {formatDateTimeLabel(
              request.shiftDate,
              request.shiftStartTime,
              request.shiftEndTime,
            )}
          </Text>
        </View>
        <StatusBadge status={request.status} />
      </View>

      <View style={styles.metaBlock}>
        <View style={styles.metaRow}>
          <AppIcon name="location" size={16} color={AppColors.textMuted} />
          <Text style={styles.metaText}>
            {joinInlineText(
              [request.shiftStoreName, request.shiftPosition],
              ', ',
            )}
          </Text>
        </View>

        {showRequester ? (
          <View style={styles.metaRow}>
            <AppIcon name="employee" size={16} color={AppColors.textMuted} />
            <Text style={styles.metaText}>
              {APP_COPY.requests.requesterLabel}:{' '}
              {request.createdByEmployeeName}
            </Text>
          </View>
        ) : null}

        {request.type === 'yield' && request.targetEmployeeName ? (
          <View style={styles.metaRow}>
            <AppIcon name="swap" size={16} color={AppColors.textMuted} />
            <Text style={styles.metaText}>
              {APP_COPY.requests.targetLabel}: {request.targetEmployeeName}
            </Text>
          </View>
        ) : null}
      </View>

      <Text style={styles.reason} numberOfLines={3}>
        {request.reason}
      </Text>

      {request.managerNote ? (
        <View style={styles.managerNoteBox}>
          <Text style={styles.managerNoteLabel}>
            {APP_COPY.requests.managerNoteLabel}
          </Text>
          <Text style={styles.managerNoteText}>{request.managerNote}</Text>
        </View>
      ) : null}
    </View>
  );

  if (!onPress) {
    return content;
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${REQUEST_TYPE_LABELS[request.type]}, ${request.shiftStoreName}, ${formatDateTimeLabel(
        request.shiftDate,
        request.shiftStartTime,
        request.shiftEndTime,
      )}`}
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.92 : 1 }]}
    >
      {content}
    </Pressable>
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
    gap: spacingTokens.xxs + 1,
  },
  title: {
    fontSize: typographyTokens.titleLg,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
  },
  metaBlock: {
    gap: spacingTokens.sm,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  metaText: {
    flex: 1,
    fontSize: typographyTokens.bodySm,
    color: AppColors.textMuted,
  },
  reason: {
    fontSize: typographyTokens.bodyLg,
    lineHeight: typographyTokens.lineHeightLg,
    color: AppColors.textSecondary,
  },
  managerNoteBox: {
    borderRadius: radiusTokens.lg,
    padding: spacingTokens.md + spacingTokens.xxs,
    backgroundColor: AppColors.surfaceMuted,
    gap: spacingTokens.xxs,
  },
  managerNoteLabel: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    textTransform: 'uppercase',
    color: AppColors.textMuted,
  },
  managerNoteText: {
    fontSize: typographyTokens.bodySm,
    lineHeight: typographyTokens.lineHeightSm,
    color: AppColors.text,
  },
});
