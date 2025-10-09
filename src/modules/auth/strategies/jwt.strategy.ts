import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../../prisma/prisma.service';
import { JwtPayload, AuthenticatedUser } from '../types/auth.types';

/**
 * 🎫 JWT STRATEGY - для захищених endpoints
 *
 * Як працює:
 * 1. Passport автоматично витягує JWT токен з Authorization header
 * 2. Перевіряє підпис токену (JWT_SECRET)
 * 3. Якщо токен валідний - викликає validate() з payload
 * 4. Якщо validate повертає user - доступ дозволено
 * 5. User потрапляє в req.user для використання в Controllers
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // 🔍 Звідки брати токен
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Authorization: Bearer <token>
      ignoreExpiration: false, // Перевіряємо термін дії
      secretOrKey: process.env.JWT_SECRET || 'dev-fallback-secret-key', // Секрет для валідації підпису
    });
  }

  /**
   * 🔍 ВАЛІДАЦІЯ JWT PAYLOAD
   * Викликається ПІСЛЯ успішної перевірки підпису токену
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
