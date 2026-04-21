import { Pressable, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import { APP_COPY } from '@/src/constants/copy';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import { formatIsoDateTime } from '@/src/utils/text';
import type { AnnouncementSummary } from '@/src/services/flexshift-service';

interface AnnouncementCardProps {
  item: AnnouncementSummary;
  onAcknowledge?: () => void;
}

export function AnnouncementCard({
  item,
  onAcknowledge,
}: AnnouncementCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.title}>{item.title}</Text>
        <View style={styles.metaChip}>
          <Text style={styles.meta}>
            {item.acknowledgedAt
              ? APP_COPY.announcements.acknowledged
              : item.requiresAck
                ? APP_COPY.announcements.requiresAcknowledgement
                : APP_COPY.announcements.informational}
          </Text>
        </View>
      </View>

      <Text style={styles.body}>{item.body}</Text>
      <Text style={styles.timestamp}>
        {formatIsoDateTime(item.publishedAt)}
      </Text>

      {item.requiresAck && !item.acknowledgedAt && onAcknowledge ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${APP_COPY.announcements.acknowledgeAction}: ${item.title}`}
          onPress={onAcknowledge}
          style={styles.button}
        >
          <Text style={styles.buttonText}>
            {APP_COPY.announcements.acknowledgeAction}
          </Text>
        </Pressable>
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
    gap: spacingTokens.md,
    shadowColor: AppColors.shadow,
    shadowOpacity: 1,
    shadowOffset: {
      width: 0,
      height: 12,
    },
    shadowRadius: 20,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacingTokens.md,
  },
  title: {
    flex: 1,
    fontSize: typographyTokens.titleSm,
    fontWeight: '800',
    color: AppColors.text,
  },
  metaChip: {
    borderRadius: radiusTokens.pill,
    backgroundColor: AppColors.primarySoft,
    paddingHorizontal: spacingTokens.sm + spacingTokens.xxs,
    paddingVertical: spacingTokens.xs,
    alignSelf: 'flex-start',
  },
  meta: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.accent,
  },
  body: {
    fontSize: typographyTokens.bodyLg,
    lineHeight: typographyTokens.lineHeightLg,
    color: AppColors.textSecondary,
  },
  timestamp: {
    fontSize: typographyTokens.caption,
    color: AppColors.textMuted,
  },
  button: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacingTokens.md + spacingTokens.xxs,
    paddingVertical: spacingTokens.sm + spacingTokens.xxs / 2,
    borderRadius: radiusTokens.pill,
    backgroundColor: AppColors.primary,
  },
  buttonText: {
    fontSize: typographyTokens.caption,
    fontWeight: '700',
    color: AppColors.accent,
  },
});
