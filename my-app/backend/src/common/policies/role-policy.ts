import { ForbiddenException } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export function ensureAllowedRole(
  currentUser: AuthenticatedUser,
  ...roles: UserRole[]
) {
  if (!roles.includes(currentUser.role)) {
    throw new ForbiddenException('Bạn không có quyền thực hiện thao tác này.');
  }
}
