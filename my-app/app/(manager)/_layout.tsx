import { Redirect, Stack } from 'expo-router';

import { AppColors } from '@/src/constants/colors';
import { useAppState } from '@/src/hooks/use-app-state';

export default function ManagerLayout() {
  const { currentUser, isReady } = useAppState();

  if (!isReady) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (currentUser.role !== 'manager') {
    return <Redirect href="/(employee)/(tabs)/dashboard" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: AppColors.text,
        headerStyle: { backgroundColor: '#FFFFFF' },
        contentStyle: { backgroundColor: AppColors.background },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="approvals/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiết yêu cầu',
        }}
      />
    </Stack>
  );
}
