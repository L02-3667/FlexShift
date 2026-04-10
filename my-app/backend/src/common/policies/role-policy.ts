import { ForbiddenException } from '@nestjs/common';
import type { UserRole } from '@prisma/client';

import type { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

export function ensureAllowedRole(
  currentUser: AuthenticatedUser,
  ...roles: UserRole[]
) {
  if (!roles.includes(currentUser.role)) {
    throw new ForbiddenException('Ban khong co quyen thuc hien thao tac nay.');
  }
}
