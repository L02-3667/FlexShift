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
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <RequestCard
            request={item}
            showRequester
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
              title="Yeu cau cho duyet"
              subtitle="Gom toan bo xin nghi va nhuong ca ve mot hang xu ly ro rang, uu tien muc con cho."
            />
            <Text style={styles.countText}>
              {pendingCount} yeu cau dang cho duyet
            </Text>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.stateText}>
                Dang tai danh sach yeu cau...
              </Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Khong tai duoc danh sach yeu cau"
              description={error}
              actionLabel="Thu lai"
              onAction={reload}
            />
          ) : (
            <EmptyState
              title="Chua co yeu cau nao"
              description="Hien chua co don xin nghi hoac nhuong ca nao can xu ly."
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
