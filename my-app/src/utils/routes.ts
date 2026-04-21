import type { Href } from 'expo-router';

import type { UserRole } from '@/src/types/models';

export function getHomeRouteForRole(role: UserRole): Href {
  return role === 'manager'
    ? '/(manager)/(tabs)/dashboard'
    : '/(employee)/(tabs)/dashboard';
}
