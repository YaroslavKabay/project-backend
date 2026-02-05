import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-jwt';
import type { Request } from 'express';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../types/auth.types';

/**
 * 🍪 JWT STRATEGY - для захищених endpoints з HTTP-only cookies
 *
 * Як працює:
 * 1. Passport автоматично витягує JWT токен з HTTP-only cookie 'access_token'
 * 2. Перевіряє підпис токену (JWT_SECRET)
 * 3. Якщо токен валідний - викликає validate() з payload
 * 4. Якщо validate повертає user - доступ дозволено
 * 5. User потрапляє в req.user для використання в Controllers
 */

/**
 * 🍪 CUSTOM JWT EXTRACTOR - витягує токен з HTTP-only cookie
 */
const cookieExtractor = (req: Request): string | null => {
  let token: string | null = null;
  if (req && req.cookies) {
    token = (req.cookies['access_token'] as string | undefined) || null;
  }
  return token;
};
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // 🍪 Звідки брати токен - з HTTP-only cookie
      jwtFromRequest: cookieExtractor, // access_token cookie
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
