import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../../modules/auth/types/auth.types';

interface AuthenticatedRequest {
  user: AuthenticatedUser;
}

/**
 * 🎯 @CURRENTUSER ДЕКОРАТОР
 *
 * Витягує поточного авторизованого користувача з request об'єкта
 *
 * @example
 * ```typescript
 * @UseGuards(JwtAuthGuard)
 * @Get('profile')
 * getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
 *   return user; // Прямий доступ до користувача!
 * }
 * ```
 *
 * @example Замість довгого коду:
 * ```typescript
 * // ❌ БУЛО (довго):
 * getProfile(@Request() req: AuthenticatedRequest): AuthenticatedUser {
 *   return req.user;
 * }
 *
 * // ✅ СТАЛО (коротко):
 * getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
 *   return user;
 * }
 * ```
 */
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    // Отримуємо HTTP request з execution context з правильною типізацією
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();

    // Перевіряємо що користувач існує (Guards повинні це гарантувати)
    if (!request.user) {
      throw new Error(
        'User not authenticated - make sure to use appropriate Guards',
      );
    }

    // Повертаємо користувача (встановлений JwtStrategy або LocalStrategy)
    return request.user;
  },
);
