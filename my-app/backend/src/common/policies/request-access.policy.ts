import type { UserRole } from '@prisma/client';

export function canViewRequest(
  role: UserRole,
  requestOwnerUserId: string,
  currentUserId: string,
) {
  return role === 'manager' || requestOwnerUserId === currentUserId;
}
