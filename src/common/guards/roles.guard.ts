import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../../../generated/prisma';
import { ROLES_KEY } from '../decorators/roles.decorator';
import type { AuthenticatedUser } from '../../modules/auth/types/auth.types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // Зчитуємо які ролі потрібні для цього ендпоінту (з @Roles декоратора)
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    // Якщо @Roles не вказано — ендпоінт відкритий для всіх авторизованих
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    // Беремо юзера з request (вже встановлений JwtAuthGuard)
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedUser }>();
    const user = request.user;

    // Перевіряємо чи є потрібна роль
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('Недостатньо прав для виконання цієї дії');
    }

    return true;
  }
}
