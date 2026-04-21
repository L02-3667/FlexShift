import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppInput } from '@/src/components/common/AppInput';
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { AppColors } from '@/src/constants/colors';
import { POSITION_OPTIONS, STORE_OPTIONS } from '@/src/constants/options';
import { useAppState } from '@/src/hooks/use-app-state';
import { createOpenShiftAction } from '@/src/services/flexshift-actions';
import { addDays, formatDateInput, formatDisplayDate } from '@/src/utils/date';
import { validateOpenShiftFields } from '@/src/utils/validation';

const initialForm = {
  date: '',
  startTime: '',
  endTime: '',
  storeName: STORE_OPTIONS[0],
  position: POSITION_OPTIONS[0],
  note: '',
};

const quickDateOptions = Array.from({ length: 4 }, (_, index) => {
  const value = formatDateInput(addDays(new Date(), index));

    return {
      value,
      label:
        index === 0
        ? 'Hôm nay'
        : index === 1
          ? 'Ngày mai'
          : formatDisplayDate(value),
  };
});

const timeRangeOptions = [
  { startTime: '07:00', endTime: '11:00', label: 'Ca sáng 07:00 - 11:00' },
  { startTime: '09:00', endTime: '13:00', label: 'Ca giữa ngày 09:00 - 13:00' },
  { startTime: '13:00', endTime: '17:00', label: 'Ca chiều 13:00 - 17:00' },
  { startTime: '17:00', endTime: '21:00', label: 'Ca tối 17:00 - 21:00' },
];

export function CreateOpenShiftScreen() {
  const db = useSQLiteContext();
  const { refreshData } = useAppState();
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const onSubmit = async () => {
    const validationError = validateOpenShiftFields(form);

    if (validationError) {
      setFormError(validationError);
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);
      const result = await createOpenShiftAction(db, form);
      await refreshData();
      setForm(initialForm);
      Alert.alert(
        result.delivery === 'sent' ? 'Đã tạo ca trống' : 'Đã đưa vào hàng đợi',
        result.delivery === 'sent'
          ? 'Ca trống mới đã sẵn sàng để nhân viên nhận nhanh.'
          : 'Ca trống mới đã được lưu local và sẽ gửi lên server khi kết nối ổn định.',
      );
    } catch (creationError) {
      setFormError(
        creationError instanceof Error
          ? creationError.message
          : 'Không thể tạo ca trống.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={styles.safeArea}
      testID="manager-create-open-shift-screen"
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <SectionHeader
            title="Tạo ca trống"
            subtitle="Chọn nhanh ngày, khung giờ và vị trí để ca mới xuất hiện ngay ở màn Nhận ca nhanh."
          />

          <SyncStatusBanner />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Chọn ngày nhanh</Text>
            <View style={styles.chipWrap}>
              {quickDateOptions.map((option, index) => {
                const selected = form.date === option.value;

                return (
                  <Pressable
                    key={option.value}
                    testID={`manager-open-shift-date-option-${index + 1}`}
                    onPress={() =>
                      setForm((current) => ({ ...current, date: option.value }))
                    }
                    style={[styles.chip, selected ? styles.chipActive : null]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected ? styles.chipTextActive : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AppInput
            label="Ngày làm việc"
            hint="Bạn vẫn có thể nhập tay theo định dạng YYYY-MM-DD nếu cần."
            value={form.date}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, date: value }))
            }
            placeholder="2026-04-15"
          />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Khung giờ gợi ý</Text>
            <View style={styles.chipWrap}>
              {timeRangeOptions.map((option, index) => {
                const selected =
                  form.startTime === option.startTime &&
                  form.endTime === option.endTime;

                return (
                  <Pressable
                    key={option.label}
                    testID={`manager-open-shift-time-option-${index + 1}`}
                    onPress={() =>
                      setForm((current) => ({
                        ...current,
                        startTime: option.startTime,
                        endTime: option.endTime,
                      }))
                    }
                    style={[styles.chip, selected ? styles.chipActive : null]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected ? styles.chipTextActive : null,
                      ]}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View style={styles.row}>
            <View style={styles.rowColumn}>
              <AppInput
                label="Giờ bắt đầu"
                hint="HH:mm"
                value={form.startTime}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, startTime: value }))
                }
                placeholder="09:00"
              />
            </View>
            <View style={styles.rowColumn}>
              <AppInput
                label="Giờ kết thúc"
                hint="HH:mm"
                value={form.endTime}
                onChangeText={(value) =>
                  setForm((current) => ({ ...current, endTime: value }))
                }
                placeholder="13:00"
              />
            </View>
          </View>

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Cửa hàng</Text>
            <View style={styles.chipWrap}>
              {STORE_OPTIONS.map((option) => {
                const selected = form.storeName === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      setForm((current) => ({ ...current, storeName: option }))
                    }
                    style={[styles.chip, selected ? styles.chipActive : null]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected ? styles.chipTextActive : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AppInput
            label="Cửa hàng"
            hint="Có thể chỉnh lại nếu cần."
            value={form.storeName}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, storeName: value }))
            }
          />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Vị trí cần bổ sung</Text>
            <View style={styles.chipWrap}>
              {POSITION_OPTIONS.map((option) => {
                const selected = form.position === option;

                return (
                  <Pressable
                    key={option}
                    onPress={() =>
                      setForm((current) => ({ ...current, position: option }))
                    }
                    style={[styles.chip, selected ? styles.chipActive : null]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        selected ? styles.chipTextActive : null,
                      ]}
                    >
                      {option}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <AppInput
            label="Vị trí"
            hint="Có thể nhập tay nếu cần vị trí đặc biệt."
            value={form.position}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, position: value }))
            }
          />

          <AppInput
            label="Lý do / ghi chú"
            multiline
            testID="manager-open-shift-note-input"
            value={form.note}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, note: value }))
            }
            placeholder="Ví dụ: thiếu người ca tối, bổ sung cuối tuần, cần thay ca đột xuất..."
          />

          {formError ? (
            <Text style={styles.errorText} testID="manager-create-open-shift-error">
              {formError}
            </Text>
          ) : null}

          <PrimaryButton
            label="Tạo ca trống"
            onPress={onSubmit}
            loading={submitting}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  flex: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowColumn: {
    flex: 1,
  },
  group: {
    gap: 10,
  },
  groupTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: AppColors.text,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    backgroundColor: AppColors.surface,
    borderWidth: 1,
    borderColor: AppColors.border,
  },
  chipActive: {
    backgroundColor: AppColors.primarySoft,
    borderColor: AppColors.primary,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '700',
    color: AppColors.textSecondary,
  },
  chipTextActive: {
    color: AppColors.primary,
  },
  errorText: {
    fontSize: 13,
    color: AppColors.danger,
  },
});
