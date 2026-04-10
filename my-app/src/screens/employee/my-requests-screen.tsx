import { router, type Href } from 'expo-router';
import { useSQLiteContext } from '@/src/db/sqlite-provider';
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
import { PrimaryButton } from '@/src/components/common/PrimaryButton';
import { SectionHeader } from '@/src/components/common/SectionHeader';
import { AppColors } from '@/src/constants/colors';
import { useAppState } from '@/src/hooks/use-app-state';
import { useAsyncData } from '@/src/hooks/use-async-data';
import { getMyRequestsData } from '@/src/services/flexshift-service';

export function MyRequestsScreen() {
  const db = useSQLiteContext();
  const { currentUser, refreshToken } = useAppState();

  const { data, error, loading, reload } = useAsyncData(
    () => getMyRequestsData(db, currentUser?.id ?? ''),
    [db, currentUser?.id, refreshToken],
    [],
  );

  if (!currentUser) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        contentContainerStyle={styles.content}
        data={data}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => <RequestCard request={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.headerBlock}>
            <SectionHeader
              title="Yeu cau cua toi"
              subtitle="Theo doi tinh trang xin nghi va nhuong ca theo quy trinh ro rang, khong con troi thong tin."
            />
            <View style={styles.actionRow}>
              <PrimaryButton
                label="Tao don xin nghi"
                onPress={() =>
                  router.push('/(employee)/requests/create-leave' as Href)
                }
                style={styles.actionButton}
              />
              <PrimaryButton
                label="De nghi nhuong ca"
                onPress={() =>
                  router.push('/(employee)/requests/create-yield' as Href)
                }
                variant="secondary"
                style={styles.actionButton}
              />
            </View>
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <View style={styles.stateBox}>
              <ActivityIndicator color={AppColors.primary} />
              <Text style={styles.stateText}>Dang tai yeu cau...</Text>
            </View>
          ) : error ? (
            <EmptyState
              title="Khong tai duoc yeu cau"
              description={error}
              actionLabel="Thu lai"
              onAction={reload}
            />
          ) : (
            <EmptyState
              title="Ban chua gui yeu cau nao"
              description="Khi can xin nghi hoac nhuong ca, ban co the tao moi ngay tu man nay."
              actionLabel="Xin nghi ca"
              onAction={() =>
                router.push('/(employee)/requests/create-leave' as Href)
              }
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
    gap: 16,
    marginBottom: 18,
  },
  actionRow: {
    flexDirection: 'column',
    gap: 10,
  },
  actionButton: {
    width: '100%',
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
    gap: 10,
    alignItems: 'center',
  },
  stateText: {
    fontSize: 14,
    color: AppColors.textSecondary,
  },
});
