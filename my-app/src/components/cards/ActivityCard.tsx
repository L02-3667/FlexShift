import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import type { ActivityUpdate } from '@/src/services/flexshift-service';

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
    <View style={[styles.card, { backgroundColor: palette.backgroundColor }]}>
      <View style={[styles.marker, { backgroundColor: palette.accentColor }]} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>{item.title}</Text>
          <Text style={styles.time}>{item.timestampLabel}</Text>
        </View>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    padding: 16,
    gap: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  marker: {
    width: 10,
    height: 10,
    borderRadius: 999,
    marginTop: 5,
  },
  content: {
    flex: 1,
    gap: 6,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text,
  },
  time: {
    fontSize: 12,
    color: AppColors.textMuted,
  },
  description: {
    fontSize: 13,
    lineHeight: 19,
    color: AppColors.textSecondary,
  },
});
