import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/src/components/common/AppIcon';
import { DateTimeRow } from '@/src/components/common/DateTimeRow';
import { StatusBadge } from '@/src/components/common/StatusBadge';
import { AppColors } from '@/src/constants/colors';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import type { ShiftView } from '@/src/types/models';
import { formatDateTimeLabel } from '@/src/utils/date';

interface ShiftCardProps {
  shift: ShiftView;
  showEmployeeName?: boolean;
  onPress?: () => void;
}

export function ShiftCard({
  shift,
  showEmployeeName = false,
  onPress,
}: ShiftCardProps) {
  const content = (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text style={styles.title}>{shift.position}</Text>
          <Text style={styles.subtitle}>{shift.storeName}</Text>
        </View>
        <StatusBadge status={shift.status} />
      </View>

      <DateTimeRow
        date={shift.date}
        startTime={shift.startTime}
        endTime={shift.endTime}
      />

      {showEmployeeName ? (
        <View style={styles.metaRow}>
          <AppIcon name="employee" size={16} color={AppColors.textMuted} />
          <Text style={styles.metaText}>{shift.employeeName}</Text>
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
      accessibilityLabel={`${shift.position}, ${shift.storeName}, ${formatDateTimeLabel(shift.date, shift.startTime, shift.endTime)}`}
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
    shadowRadius: 20,
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
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  metaText: {
    fontSize: typographyTokens.body,
    color: AppColors.textMuted,
  },
});
