import { Redirect, Stack } from 'expo-router';

import { AppColors } from '@/src/constants/colors';
import { useAppState } from '@/src/hooks/use-app-state';

export default function EmployeeLayout() {
  const { currentUser, isReady } = useAppState();

  if (!isReady) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href="/(auth)/login" />;
  }

  if (currentUser.role !== 'employee') {
    return <Redirect href="/(manager)/(tabs)/dashboard" />;
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
        name="open-shifts/[id]"
        options={{
          headerShown: true,
          title: 'Chi tiet ca trong',
        }}
      />
      <Stack.Screen
        name="requests/create-leave"
        options={{
          headerShown: true,
          title: 'Tao don xin nghi',
        }}
      />
      <Stack.Screen
        name="requests/create-yield"
        options={{
          headerShown: true,
          title: 'De nghi nhuong ca',
        }}
      />
      <Stack.Screen
        name="requests/create-swap"
        options={{
          headerShown: true,
          title: 'De nghi nhuong ca',
        }}
      />
    </Stack>
  );
}
