import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../../../generated/prisma';

export const ROLES_KEY = 'roles';

// Декоратор @Roles(UserRole.ADMIN) — позначає які ролі мають доступ до ендпоінту
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
