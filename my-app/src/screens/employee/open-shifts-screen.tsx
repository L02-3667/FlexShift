import { router } from 'expo-router';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OpenShiftCard } from '@/src/components/cards/OpenShiftCard';
import { EmptyState } from '@/src/components/common/EmptyState';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { SyncStatusBanner } from '@/src/components/common/SyncStatusBanner';
import { AppColors } from '@/src/constants/colors';
import { useAppState } from '@/src/hooks/use-app-state';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { claimOpenShiftAction } from '@/src/services/flexshift-actions';
import { getOpenShiftListingSummary } from '@/src/services/flexshift-service';

const initialState = {
  openShifts: [],
  total: 0,
};

export function OpenShiftsScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshData, refreshToken } = useAppState();
  const [claimingId, setClaimingId] = useState<string | null>(null);

  const { data, error, loading, reload } = useAsyncData(
    () => getOpenShiftListingSummary(db),
    [db, refreshToken],
    initialState,
  );

  const handleQuickClaim = (openShiftId: string) => {
    if (!currentUser) {
      return;
    }

    Alert.alert(
      'Nhận nhanh ca này?',
      'Ca phù hợp sẽ được thêm ngay vào lịch của bạn nếu không bị trùng giờ.',
      [
        {
          text: 'Xem lại',
          style: 'cancel',
        },
        {
          text: 'Nhận ca',
          onPress: async () => {
            try {
              setClaimingId(openShiftId);
              const result = await claimOpenShiftAction(
                db,
                openShiftId,
                currentUser.id,
              );
              await refreshData();
              Alert.alert(
                result.delivery === 'sent'
                  ? 'Nhận ca thành công'
                  : 'Đã đưa vào hàng đợi',
                result.delivery === 'sent'
                  ? 'Ca trống đã được chuyển vào lịch đã chốt của bạn.'
                  : 'Ca trống đã vào hàng đợi local và sẽ đồng bộ ngay khi có mạng.',
              );
            } catch (claimError) {
              Alert.alert(
                'Không thể nhận ca',
                claimError instanceof Error
                  ? claimError.message
                  : 'Vui lòng thử lại.',
              );
            } finally {
              setClaimingId(null);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} testID="employee-open-shifts-screen">
      <FlatList
        contentContainerStyle={styles.content}
        data={data.openShifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <OpenShiftCard
            openShift={item}
            actionLabel="Nhận nhanh"
            actionLoading={claimingId === item.id}
            onActionPress={() => handleQuickClaim(item.id)}
            testID={`employee-open-shift-card-${index + 1}`}
            onPress={() =>
              router.push({
                pathname: '/(employee)/open-shifts/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <SyncStatusBanner />
            <SectionHeader
              title="Nhận ca nhanh"
              subtitle="Chọn ca phù hợp, hệ thống sẽ tự kiểm tra trùng lịch trước khi thêm vào lịch đã chốt."
            />
            <Text style={styles.countText}>{data.total} ca đang khả dụng</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.stateText}>Đang tải ca trống...</Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Không tải được ca trống"
              description={error}
              actionLabel="Thử lại"
              onAction={reload}
            />
          ) : (
            <EmptyState
              title="Hiện chưa có ca trống"
              description="Quản lý chưa tạo thêm ca mới hoặc tất cả ca trống đã được nhận."
            />
          )
        }
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
      />
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
    paddingBottom: 36,
    flexGrow: 1,
  },
  headerBlock: {
    gap: 8,
    marginBottom: 18,
  },
  countText: {
    fontSize: 13,
    color: AppColors.textSecondary,
  },
  separator: {
    height: 14,
  },
  stateBox: {
    backgroundColor: AppColors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: AppColors.border,
    padding: 24,
    alignItems: 'center',
    gap: 10,
  },
  stateText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});
