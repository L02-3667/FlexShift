import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';

interface MetricCardProps {
  label: string;
  value: string | number;
  tone?: 'primary' | 'warning' | 'neutral';
}

const TONES = {
  primary: {
    backgroundColor: AppColors.primarySoft,
    valueColor: AppColors.primary,
  },
  warning: {
    backgroundColor: AppColors.warningSoft,
    valueColor: AppColors.warning,
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
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: palette.valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 20,
    padding: 18,
    gap: 12,
    minHeight: 108,
  },
  label: {
    fontSize: 13,
    lineHeight: 18,
    color: AppColors.textSecondary,
  },
  value: {
    fontSize: 28,
    fontWeight: '800',
  },
});
