import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedAdmin } from '../../modules/admin-auth/types/admin-auth.types';

interface AuthenticatedAdminRequest {
  user: AuthenticatedAdmin;
}

export const CurrentAdmin = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedAdmin => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedAdminRequest>();
    if (!request.user) {
      throw new Error('Admin not authenticated - use AdminJwtAuthGuard');
    }
    return request.user;
  },
);
