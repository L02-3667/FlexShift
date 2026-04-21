import { StyleSheet, Text, View } from 'react-native';

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
}: MetricCardProps) {
  const palette = TONES[tone];

  return (
    <View style={[styles.card, { backgroundColor: palette.backgroundColor }]}>
      <View style={styles.labelChip}>
        <Text style={styles.label}>{label}</Text>
      </View>
      <Text style={[styles.value, { color: palette.valueColor }]}>{value}</Text>
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
  labelChip: {
    alignSelf: 'flex-start',
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.sm + spacingTokens.xxs,
    paddingVertical: spacingTokens.xs,
    backgroundColor: AppColors.surface,
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
});
