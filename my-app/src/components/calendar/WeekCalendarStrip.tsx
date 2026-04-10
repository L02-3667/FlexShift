import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import {
  radiusTokens,
  spacingTokens,
  typographyTokens,
} from '@/src/theme/tokens';
import type { CalendarDaySummary } from '@/src/services/flexshift-service';
import { joinInlineText } from '@/src/utils/text';

interface WeekCalendarStripProps {
  days: CalendarDaySummary[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

function buildMetaLabel(day: CalendarDaySummary) {
  const parts: string[] = [];

  if (day.scheduledCount > 0) {
    parts.push(`${day.scheduledCount} ca`);
  }

  if (day.openShiftCount > 0) {
    parts.push(`${day.openShiftCount} mo`);
  }

  if (day.pendingRequestCount > 0) {
    parts.push(`${day.pendingRequestCount} cho`);
  }

  return parts.length > 0 ? joinInlineText(parts, ', ') : 'Trong';
}

export function WeekCalendarStrip({
  days,
  selectedDate,
  onSelectDate,
}: WeekCalendarStripProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
    >
      {days.map((day) => {
        const selected = day.date === selectedDate;

        return (
          <Pressable
            key={day.date}
            onPress={() => onSelectDate(day.date)}
            style={[
              styles.card,
              selected ? styles.cardActive : null,
              day.isToday && !selected ? styles.cardToday : null,
            ]}
          >
            <View style={styles.header}>
              <Text
                style={[styles.weekday, selected ? styles.weekdayActive : null]}
              >
                {day.isToday ? 'Hom nay' : day.weekdayLabel}
              </Text>
              <Text
                style={[
                  styles.dayLabel,
                  selected ? styles.dayLabelActive : null,
                ]}
              >
                {day.dayLabel}
              </Text>
            </View>

            <View style={styles.metrics}>
              <Text
                style={[
                  styles.metricText,
                  selected ? styles.metricTextActive : null,
                ]}
              >
                {buildMetaLabel(day)}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacingTokens.md,
  },
  card: {
    width: 144,
    borderRadius: radiusTokens.xl,
    padding: spacingTokens.lg,
    borderWidth: 1,
    borderColor: AppColors.border,
    backgroundColor: AppColors.surface,
    gap: spacingTokens.md,
  },
  cardActive: {
    borderColor: AppColors.primary,
    backgroundColor: AppColors.primarySoft,
  },
  cardToday: {
    borderColor: AppColors.accent,
  },
  header: {
    gap: spacingTokens.xxs,
  },
  weekday: {
    fontSize: typographyTokens.bodySm,
    fontWeight: '700',
    color: AppColors.textSecondary,
    textTransform: 'capitalize',
  },
  weekdayActive: {
    color: AppColors.primary,
  },
  dayLabel: {
    fontSize: 28,
    fontWeight: '800',
    color: AppColors.text,
  },
  dayLabelActive: {
    color: AppColors.primary,
  },
  metrics: {
    gap: spacingTokens.xs,
  },
  metricText: {
    fontSize: typographyTokens.caption,
    lineHeight: 18,
    color: AppColors.textMuted,
  },
  metricTextActive: {
    color: AppColors.primary,
  },
});
