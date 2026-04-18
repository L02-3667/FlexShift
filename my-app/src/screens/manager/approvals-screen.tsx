import { router } from 'expo-router';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { RequestCard } from '@/src/components/cards/RequestCard';
import { EmptyState } from '@/src/components/common/EmptyState';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { AppColors } from '@/src/constants/colors';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { useAppState } from '@/src/hooks/use-app-state';
import { getApprovalRequestsData } from '@/src/services/flexshift-service';

export function ApprovalsScreen() {
  const db = useSQLiteContext();
  const { refreshToken } = useAppState();

  const { data, error, loading, reload } = useAsyncData(
    () => getApprovalRequestsData(db),
    [db, refreshToken],
    [],
  );

  const pendingCount = data.filter(
    (request) => request.status === 'pending',
  ).length;

  return (
    <SafeAreaView style={styles.safeArea} testID="manager-approvals-screen">
      <FlatList
        contentContainerStyle={styles.content}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <RequestCard
            request={item}
            showRequester
            testID={`manager-approval-request-card-${index + 1}`}
            onPress={() =>
              router.push({
                pathname: '/(manager)/approvals/[id]',
                params: { id: item.id },
              })
            }
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <SectionHeader
              title="Yêu cầu chờ duyệt"
              subtitle="Gom toàn bộ xin nghỉ và nhường ca về một hàng xử lý rõ ràng, ưu tiên mục còn chờ."
            />
            <Text style={styles.countText}>
              {pendingCount} yêu cầu đang chờ duyệt
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.stateText}>
                Đang tải danh sách yêu cầu...
              </Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Không tải được danh sách yêu cầu"
              description={error}
              actionLabel="Thử lại"
              onAction={reload}
            />
          ) : (
            <EmptyState
              title="Chưa có yêu cầu nào"
              description="Hiện chưa có đơn xin nghỉ hoặc nhường ca nào cần xử lý."
            />
          )
        }
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
