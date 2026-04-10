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
        ? 'Hom nay'
        : index === 1
          ? 'Ngay mai'
          : formatDisplayDate(value),
  };
});

const timeRangeOptions = [
  { startTime: '07:00', endTime: '11:00', label: 'Ca sang 07:00 - 11:00' },
  { startTime: '09:00', endTime: '13:00', label: 'Ca giua ngay 09:00 - 13:00' },
  { startTime: '13:00', endTime: '17:00', label: 'Ca chieu 13:00 - 17:00' },
  { startTime: '17:00', endTime: '21:00', label: 'Ca toi 17:00 - 21:00' },
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
        result.delivery === 'sent' ? 'Da tao ca trong' : 'Da dua vao hang doi',
        result.delivery === 'sent'
          ? 'Ca trong moi da san sang de nhan vien nhan nhanh.'
          : 'Ca trong moi da duoc luu local va se gui len server khi ket noi on dinh.',
      );
    } catch (creationError) {
      setFormError(
        creationError instanceof Error
          ? creationError.message
          : 'Khong the tao ca trong.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <SectionHeader
            title="Tao ca trong"
            subtitle="Chon nhanh ngay, khung gio va vi tri de ca moi xuat hien ngay o man Nhan ca nhanh."
          />

          <SyncStatusBanner />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Chon ngay nhanh</Text>
            <View style={styles.chipWrap}>
              {quickDateOptions.map((option) => {
                const selected = form.date === option.value;

                return (
                  <Pressable
                    key={option.value}
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
            label="Ngay lam viec"
            hint="Ban van co the nhap tay theo dinh dang YYYY-MM-DD neu can."
            value={form.date}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, date: value }))
            }
            placeholder="2026-04-15"
          />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Khung gio goi y</Text>
            <View style={styles.chipWrap}>
              {timeRangeOptions.map((option) => {
                const selected =
                  form.startTime === option.startTime &&
                  form.endTime === option.endTime;

                return (
                  <Pressable
                    key={option.label}
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
                label="Gio bat dau"
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
                label="Gio ket thuc"
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
            <Text style={styles.groupTitle}>Cua hang</Text>
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
            label="Cua hang"
            hint="Co the chinh lai neu can."
            value={form.storeName}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, storeName: value }))
            }
          />

          <View style={styles.group}>
            <Text style={styles.groupTitle}>Vi tri can bo sung</Text>
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
            label="Vi tri"
            hint="Co the nhap tay neu can vi tri dac biet."
            value={form.position}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, position: value }))
            }
          />

          <AppInput
            label="Ly do / ghi chu"
            multiline
            value={form.note}
            onChangeText={(value) =>
              setForm((current) => ({ ...current, note: value }))
            }
            placeholder="Vi du: thieu nguoi ca toi, bo sung cuoi tuan, can thay ca dot xuat..."
          />

          {formError ? <Text style={styles.errorText}>{formError}</Text> : null}

          <PrimaryButton
            label="Tao ca trong"
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
