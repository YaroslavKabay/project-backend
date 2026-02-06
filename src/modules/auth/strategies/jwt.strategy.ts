import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../types/auth.types';

/**
 * 🎫 JWT STRATEGY - для захищених endpoints з Authorization header
 *
 * Як працює:
 * 1. SDK відправляє Authorization: Bearer <access_token>
 * 2. Passport автоматично витягує JWT токен з header
 * 3. Перевіряє підпис токену (JWT_SECRET)
 * 4. Якщо токен валідний - викликає validate() з payload
 * 5. Якщо validate повертає user - доступ дозволено
 * 6. User потрапляє в req.user для використання в Controllers
 *
 * 🚀 HYBRID ПІДХІД:
 * - Access token в Authorization header (SDK контролює)
 * - Refresh token в HTTP-only cookie (безпечно)
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // 🎫 Звідки брати токен - з Authorization: Bearer header
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Standard approach
      ignoreExpiration: false, // Перевіряємо термін дії
      secretOrKey: process.env.JWT_SECRET!, // Секрет для валідації підпису (гарантовано існує через env validation)
    });
  }

  /**
   * 🔍 ВАЛІДАЦІЯ JWT PAYLOAD (СТАНДАРТНИЙ ПІДХІД)
   * Викликається ПІСЛЯ успішної перевірки підпису токену
   * Перевіряє тільки чи користувач існує в БД
   */
  async validate(payload: JwtPayload): Promise<AuthenticatedUser> {
    // 🔍 Перевіряємо чи користувач ще існує в БД
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub }, // payload.sub = user.id
      select: {
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        balance: true,
        phone: true,
        createdAt: true,
        updatedAt: true,
        // НЕ повертаємо sensitive поля (passwordHash, tokens)
      },
    });

    if (!user) {
      throw new UnauthorizedException('Користувач не знайдений');
    }

    // 🎯 Повертаємо user - він потрапить в req.user
    return user;
  }
}
