import { Redirect, Stack } from 'expo-router';

import { useAppState } from '@/src/hooks/use-app-state';
import { getHomeRouteForRole } from '@/src/utils/routes';

export default function AuthLayout() {
  const { currentUser, isReady } = useAppState();

  if (!isReady) {
    return null;
  }

  if (currentUser) {
    return <Redirect href={getHomeRouteForRole(currentUser.role)} />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
