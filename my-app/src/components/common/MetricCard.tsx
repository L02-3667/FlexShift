import { StyleSheet, Text, View, ViewStyle } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

interface MetricCardProps {
  label: string;
  value: string | number;
  tone?: 'primary' | 'warning' | 'neutral';
  compact?: boolean;
  style?: ViewStyle;
}

const TONES = {
  primary: {
    backgroundColor: AppColors.primarySoft,
    valueColor: AppColors.accent,
  },
  warning: {
    backgroundColor: AppColors.warningSoft,
    valueColor: AppColors.accent,
  },
  neutral: {
    backgroundColor: AppColors.surface,
    valueColor: AppColors.text,
  },
};

export function MetricCard({
  label,
  value,
  tone = 'neutral',
  compact = false,
  style,
}: MetricCardProps) {
  const palette = TONES[tone];

  return (
    <View
      style={[
        styles.card,
        compact ? styles.compactCard : null,
        { backgroundColor: palette.backgroundColor },
        style,
      ]}
    >
      <View style={[styles.labelChip, compact ? styles.compactLabelChip : null]}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text
        style={[
          styles.value,
          compact ? styles.compactValue : null,
          { color: palette.valueColor },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: radiusTokens.hero,
    padding: spacingTokens.lg + spacingTokens.xs,
    gap: spacingTokens.md,
    minHeight: 124,
    borderWidth: 1,
    borderColor: AppColors.border,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowRadius: 18,
    elevation: 2,
  },
  compactCard: {
    borderRadius: radiusTokens.lg,
    padding: spacingTokens.lg,
    gap: spacingTokens.sm,
    minHeight: 104,
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  labelChip: {
    alignSelf: 'flex-start',
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.sm + spacingTokens.xxs,
    paddingVertical: spacingTokens.xs,
    backgroundColor: AppColors.surface,
  },
  compactLabelChip: {
    paddingHorizontal: 0,
    paddingVertical: 0,
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: typographyTokens.caption,
    lineHeight: 16,
    fontWeight: '700',
    color: AppColors.textSecondary,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
  },
  compactValue: {
    fontSize: 30,
  },
});
