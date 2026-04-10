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
      'Nhan nhanh ca nay?',
      'Ca phu hop se duoc them ngay vao lich cua ban neu khong bi trung gio.',
      [
        {
          text: 'Xem lai',
          style: 'cancel',
        },
        {
          text: 'Nhan ca',
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
                  ? 'Nhan ca thanh cong'
                  : 'Da dua vao hang doi',
                result.delivery === 'sent'
                  ? 'Ca trong da duoc chuyen vao lich da chot cua ban.'
                  : 'Ca trong da vao hang doi local va se dong bo ngay khi co mang.',
              );
            } catch (claimError) {
              Alert.alert(
                'Khong the nhan ca',
                claimError instanceof Error
                  ? claimError.message
                  : 'Vui long thu lai.',
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
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={data.openShifts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <OpenShiftCard
            openShift={item}
            actionLabel="Nhan nhanh"
            actionLoading={claimingId === item.id}
            onActionPress={() => handleQuickClaim(item.id)}
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
              title="Nhan ca nhanh"
              subtitle="Chon ca phu hop, he thong se tu kiem tra trung lich truoc khi them vao lich da chot."
            />
            <Text style={styles.countText}>{data.total} ca dang kha dung</Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.stateText}>Dang tai ca trong...</Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Khong tai duoc ca trong"
              description={error}
              actionLabel="Thu lai"
              onAction={reload}
            />
          ) : (
            <EmptyState
              title="Hien chua co ca trong"
              description="Quan ly chua tao them ca moi hoac tat ca ca trong da duoc nhan."
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
