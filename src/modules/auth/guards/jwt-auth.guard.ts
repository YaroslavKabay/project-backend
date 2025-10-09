import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 🎫 JWT AUTH GUARD
 *
 * Простими словами: декоратор для захищених endpoints
 * Використання: @UseGuards(JwtAuthGuard)
 *
 * Що робить:
 * 1. Автоматично активує JwtStrategy
 * 2. JwtStrategy витягує JWT токен з Authorization header
 * 3. Перевіряє підпис токену + термін дії
 * 4. Завантажує користувача з БД
 * 5. Якщо все OK → req.user = user, викликається контролер
 * 6. Якщо помилка → 401 Unauthorized, контролер НЕ викликається
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
