import { StyleSheet, Text, View } from 'react-native';

import { AppIcon } from '@/src/components/common/AppIcon';
import { AppColors } from '@/src/constants/colors';
import { spacingTokens, typographyTokens } from '@/src/theme/tokens';
import { formatDateTimeLabel } from '@/src/utils/date';

interface DateTimeRowProps {
  date: string;
  startTime: string;
  endTime: string;
}

export function DateTimeRow({ date, startTime, endTime }: DateTimeRowProps) {
  return (
    <View style={styles.row}>
      <AppIcon name="calendar" size={18} color={AppColors.primary} />
      <Text style={styles.text}>
        {formatDateTimeLabel(date, startTime, endTime)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  text: {
    fontSize: typographyTokens.body,
    color: AppColors.textSecondary,
    flex: 1,
  },
});
