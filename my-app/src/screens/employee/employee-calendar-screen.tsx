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
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import {
  getEmployeeCalendarData,
  type EmployeeCalendarData,
} from '@/src/services/flexshift-service';

const initialCalendar: EmployeeCalendarData = {
  days: [],
  selectedDate: '',
  agendaByDate: {},
  weekSummary: {
    scheduledCount: 0,
    openShiftCount: 0,
    pendingRequestCount: 0,
  },
};

export function EmployeeCalendarScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshToken } = useAppState();
  const [selectedDate, setSelectedDate] = useState('');

  const { data, error, loading, reload } = useAsyncData(
    () => getEmployeeCalendarData(db, currentUser?.id ?? ''),
    [db, currentUser?.id, refreshToken],
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

  if (!currentUser) {
    return null;
  }

  const agenda = data.agendaByDate[selectedDate] ?? {
    shifts: [],
    openShifts: [],
    requests: [],
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content}>
        <SectionHeader
          title="Lịch tuần này"
          subtitle="Theo dõi ca đã chốt, ca cần người và yêu cầu liên quan ngay trên cùng một trục thời gian."
        />

        <View style={styles.metricRow}>
          <MetricCard
            label="Ca đã chốt"
            value={data.weekSummary.scheduledCount}
            tone="primary"
          />
          <MetricCard
            label="Ca cần bạn"
            value={data.weekSummary.openShiftCount}
            tone="warning"
          />
        </View>

        <MetricCard
          label="Yêu cầu chờ duyệt"
          value={data.weekSummary.pendingRequestCount}
          tone={
            data.weekSummary.pendingRequestCount > 0 ? 'warning' : 'neutral'
          }
        />

        {loading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={AppColors.primary} />
            <Text style={styles.stateText}>Đang tải lịch làm...</Text>
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
                description="Bạn chưa có ca đã chốt, ca cần người hoặc yêu cầu nào trong ngày đang xem."
                actionLabel="Xem ca cần bạn"
                onAction={() => router.push('/(employee)/(tabs)/open-shifts')}
              />
            ) : (
              <>
                {agenda.shifts.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Lịch đã chốt"
                      subtitle="Các ca đã xác nhận trong ngày đang xem."
                    />
                    {agenda.shifts.map((shift) => (
                      <ShiftCard key={shift.id} shift={shift} />
                    ))}
                  </View>
                ) : null}

                {agenda.openShifts.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Ca cần bạn"
                      subtitle="Ca trống phù hợp để nhận nhanh mà không trôi lịch."
                      actionLabel="Mở danh sách"
                      onActionPress={() =>
                        router.push('/(employee)/(tabs)/open-shifts')
                      }
                    />
                    {agenda.openShifts.map((shift) => (
                      <OpenShiftCard
                        key={shift.id}
                        openShift={shift}
                        onPress={() =>
                          router.push({
                            pathname: '/(employee)/open-shifts/[id]',
                            params: { id: shift.id },
                          })
                        }
                      />
                    ))}
                  </View>
                ) : null}

                {agenda.requests.length > 0 ? (
                  <View style={styles.section}>
                    <SectionHeader
                      title="Yêu cầu liên quan"
                      subtitle="Giữ mọi thay đổi ca trong cùng một bối cảnh thời gian để dễ theo dõi."
                      actionLabel="Mở yêu cầu"
                      onActionPress={() =>
                        router.push('/(employee)/(tabs)/requests')
                      }
                    />
                    {agenda.requests.map((request) => (
                      <RequestCard key={request.id} request={request} />
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
