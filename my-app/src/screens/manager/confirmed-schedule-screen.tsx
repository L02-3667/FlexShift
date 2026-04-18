import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OpenShiftCard } from '@/src/components/cards/OpenShiftCard';
import { RequestCard } from '@/src/components/cards/RequestCard';
import { ShiftCard } from '@/src/components/cards/ShiftCard';
import { WeekCalendarStrip } from '@/src/components/calendar/WeekCalendarStrip';
import { EmptyState } from '@/src/components/common/EmptyState';
import { MetricCard } from '@/src/components/common/MetricCard';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { AppColors } from '@/src/constants/colors';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import {
  getManagerCalendarData,
  type ManagerCalendarData,
} from '@/src/services/flexshift-service';

const initialCalendar: ManagerCalendarData = {
  days: [],
  selectedDate: '',
  agendaByDate: {},
  weekSummary: {
    confirmedShiftCount: 0,
    openShiftCount: 0,
    pendingRequestCount: 0,
  },
};

export function ConfirmedScheduleScreen() {
  const db = useSQLiteContext();
  const { refreshToken } = useAppState();
  const [selectedDate, setSelectedDate] = useState('');

  const { data, error, loading, reload } = useAsyncData(
    () => getManagerCalendarData(db),
    [db, refreshToken],
    initialCalendar,
  );

  useEffect(() => {
    if (!selectedDate && data.selectedDate) {
      setSelectedDate(data.selectedDate);
      return;
    }

    if (selectedDate && data.agendaByDate[selectedDate]) {
      return;
    }

    if (data.selectedDate) {
      setSelectedDate(data.selectedDate);
    }
  }, [data.agendaByDate, data.selectedDate, selectedDate]);

  const agenda = data.agendaByDate[selectedDate] ?? {
    shifts: [],
    openShifts: [],
    requests: [],
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="manager-calendar-screen">
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Lịch điều phối"
          subtitle="Xem cùng lúc lịch đã chốt, ca đang mở và yêu cầu phát sinh để điều phối theo ngày rõ ràng hơn."
        />

        <View style={styles.metricRow}>
          <MetricCard
            label="Ca đã chốt"
            value={data.weekSummary.confirmedShiftCount}
            tone="primary"
          />
          <MetricCard
            label="Ca đang mở"
            value={data.weekSummary.openShiftCount}
            tone="warning"
          />
        </View>

        <MetricCard
          label="Yêu cầu cần xử lý"
          value={data.weekSummary.pendingRequestCount}
          tone={
            data.weekSummary.pendingRequestCount > 0 ? 'warning' : 'neutral'
          }
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Đang tải lịch điều phối...</Text>
          </View>
        ) : error ? (
          <EmptyState
            title="Không tải được lịch"
            description={error}
            actionLabel="Thử lại"
            onAction={reload}
          />
        ) : (
          <>
            <WeekCalendarStrip
              days={data.days}
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />

            {agenda.shifts.length === 0 &&
            agenda.openShifts.length === 0 &&
            agenda.requests.length === 0 ? (
              <EmptyState
                title="Ngày này chưa có thay đổi"
                description="Hiện chưa có ca đã chốt, ca đang mở hoặc yêu cầu liên quan trong ngày đang xem."
                actionLabel="Tạo ca trống"
                onAction={() =>
                  router.push('/(manager)/(tabs)/create-open-shift')
                }
              />
            ) : (
              <>
                {agenda.shifts.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Lịch đã chốt"
                      subtitle="Nhân sự đã xác nhận hoặc đã được duyệt vào lịch."
                    />
                    {agenda.shifts.map((shift) => (
                      <ShiftCard
                        key={shift.id}
                        shift={shift}
                        showEmployeeName
                      />
                    ))}
                  </View>
                ) : null}

                {agenda.openShifts.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Ca đang mở"
                      subtitle="Theo dõi các ca cần bổ sung để lấp khoảng trống trong lịch."
                      actionLabel="Tạo thêm"
                      onActionPress={() =>
                        router.push('/(manager)/(tabs)/create-open-shift')
                      }
                    />
                    {agenda.openShifts.map((shift) => (
                      <OpenShiftCard key={shift.id} openShift={shift} />
                    ))}
                  </View>
                ) : null}

                {agenda.requests.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Yêu cầu liên quan"
                      subtitle="Giữ quyết định duyệt ca gắn trực tiếp với ngày phát sinh trên lịch."
                      actionLabel="Mở danh sách"
                      onActionPress={() =>
                        router.push('/(manager)/(tabs)/approvals')
                      }
                    />
                    {agenda.requests.map((request) => (
                      <RequestCard
                        key={request.id}
                        request={request}
                        showRequester
                        onPress={() =>
                          router.push({
                            pathname: '/(manager)/approvals/[id]',
                            params: { id: request.id },
                          })
                        }
                      />
                    ))}
                  </View>
                ) : null}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: AppColors.background,
  },
  content: {
    padding: 20,
    gap: 18,
    paddingBottom: 36,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 12,
  },
  section: {
    gap: 14,
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 24,
    gap: 10,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});
