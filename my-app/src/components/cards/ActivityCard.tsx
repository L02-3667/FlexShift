import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import type { ActivityUpdate } from '@/src/services/flexshift-service';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';

interface ActivityCardProps {
  item: ActivityUpdate;
}

const TONES: Record<
  ActivityUpdate['tone'],
  { backgroundColor: string; accentColor: string }
> = {
  primary: {
    backgroundColor: AppColors.primarySoft,
    accentColor: AppColors.primary,
  },
  warning: {
    backgroundColor: AppColors.warningSoft,
    accentColor: AppColors.warning,
  },
  neutral: {
    backgroundColor: AppColors.surfaceMuted,
    accentColor: AppColors.textMuted,
  },
};

export function ActivityCard({ item }: ActivityCardProps) {
  const palette = TONES[item.tone];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: palette.backgroundColor,
          borderLeftColor: palette.accentColor,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <View style={styles.timeChip}>
            <Text style={styles.time}>{item.timestampLabel}</Text>
          </View>
        </View>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radiusTokens.xl,
    padding: spacingTokens.lg + spacingTokens.xxs,
    gap: spacingTokens.md,
    borderWidth: 1,
    borderColor: AppColors.border,
    borderLeftWidth: 4,
  },
  content: {
    flex: 1,
    gap: spacingTokens.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
    alignItems: 'center',
  },
  title: {
    flex: 1,
    fontSize: typographyTokens.bodyLg,
    fontWeight: '800',
    color: AppColors.text,
  },
  timeChip: {
    borderRadius: radiusTokens.pill,
    backgroundColor: AppColors.surface,
    paddingHorizontal: spacingTokens.sm + spacingTokens.xxs,
    paddingVertical: spacingTokens.xs,
  },
  time: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.textMuted,
  },
  description: {
    fontSize: typographyTokens.bodySm,
    lineHeight: typographyTokens.lineHeightSm,
    color: AppColors.textSecondary,
  },
});
