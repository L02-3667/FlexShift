import { Redirect } from 'expo-router';

import { useAppState } from '@/src/hooks/use-app-state';
import { getHomeRouteForRole } from '@/src/utils/routes';

export default function IndexScreen() {
  const { currentUser, isReady } = useAppState();

  if (!isReady) {
    return null;
  }

  if (!currentUser) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={getHomeRouteForRole(currentUser.role)} />;
}
