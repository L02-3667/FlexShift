import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onActionPress?: () => void;
}

export function SectionHeader({
  title,
  subtitle,
  actionLabel,
  onActionPress,
}: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
      {actionLabel && onActionPress ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={onActionPress}
          style={({ pressed }) => [
            styles.actionChip,
            pressed ? styles.actionChipPressed : null,
          ]}
        >
          <Text style={styles.action}>{actionLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacingTokens.lg,
  },
  textBlock: {
    flex: 1,
    gap: spacingTokens.xxs,
  },
  title: {
    fontSize: typographyTokens.titleLg,
    fontWeight: '800',
    color: AppColors.text,
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: typographyTokens.bodySm,
    color: AppColors.textSecondary,
    lineHeight: 18,
  },
  actionChip: {
    borderRadius: radiusTokens.pill,
    paddingHorizontal: spacingTokens.md + spacingTokens.xxs,
    paddingVertical: spacingTokens.sm + spacingTokens.xxs / 2,
    backgroundColor: AppColors.surfaceMuted,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  actionChipPressed: {
    backgroundColor: AppColors.primarySoft,
  },
  action: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.accent,
  },
});
