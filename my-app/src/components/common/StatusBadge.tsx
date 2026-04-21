import { StyleSheet, Text, View } from 'react-native';

import { AppColors } from '@/src/constants/colors';
import {
  OPEN_SHIFT_STATUS_LABELS,
  REQUEST_STATUS_LABELS,
  SHIFT_STATUS_LABELS,
} from '@/src/constants/options';

type SupportedStatus =
  | keyof typeof SHIFT_STATUS_LABELS
  | keyof typeof OPEN_SHIFT_STATUS_LABELS
  | keyof typeof REQUEST_STATUS_LABELS;

const STATUS_META: Record<
  SupportedStatus,
  { label: string; backgroundColor: string; textColor: string }
> = {
  scheduled: {
    label: SHIFT_STATUS_LABELS.scheduled,
    backgroundColor: AppColors.infoSoft,
    textColor: AppColors.accent,
  },
  completed: {
    label: SHIFT_STATUS_LABELS.completed,
    backgroundColor: AppColors.primarySoft,
    textColor: AppColors.success,
  },
  cancelled: {
    label: SHIFT_STATUS_LABELS.cancelled,
    backgroundColor: AppColors.dangerSoft,
    textColor: AppColors.danger,
  },
  open: {
    label: OPEN_SHIFT_STATUS_LABELS.open,
    backgroundColor: AppColors.infoSoft,
    textColor: AppColors.accent,
  },
  claimed: {
    label: OPEN_SHIFT_STATUS_LABELS.claimed,
    backgroundColor: AppColors.primarySoft,
    textColor: AppColors.success,
  },
  pending: {
    label: REQUEST_STATUS_LABELS.pending,
    backgroundColor: AppColors.warningSoft,
    textColor: AppColors.warning,
  },
  approved: {
    label: REQUEST_STATUS_LABELS.approved,
    backgroundColor: AppColors.primarySoft,
    textColor: AppColors.success,
  },
  rejected: {
    label: REQUEST_STATUS_LABELS.rejected,
    backgroundColor: AppColors.dangerSoft,
    textColor: AppColors.danger,
  },
};

interface StatusBadgeProps {
  status: SupportedStatus;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const meta = STATUS_META[status];

  return (
    <View style={[styles.badge, { backgroundColor: meta.backgroundColor }]}>
      <Text style={[styles.text, { color: meta.textColor }]}>{meta.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
