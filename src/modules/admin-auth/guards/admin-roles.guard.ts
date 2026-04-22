import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ADMIN_ROLES_KEY } from '../../../common/decorators/admin-roles.decorator';
import type { AuthenticatedAdmin } from '@projectua/project-core';

@Injectable()
export class AdminRolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ADMIN_ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles?.length) return true;
    const request = context
      .switchToHttp()
      .getRequest<{ user: AuthenticatedAdmin }>();
    if (!requiredRoles.includes(request.user.role)) {
      throw new ForbiddenException('Недостатньо прав');
    }
    return true;
  }
}
