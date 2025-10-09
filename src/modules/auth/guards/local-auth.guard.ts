import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * 🚪 LOCAL AUTH GUARD
 *
 * Простими словами: декоратор для контролерів
 * Використання: @UseGuards(LocalAuthGuard)
 *
 * Що робить:
 * 1. Автоматично активує LocalStrategy
 * 2. LocalStrategy перевіряє email/password з req.body
 * 3. Якщо все OK → req.user = user, викликається контролер
 * 4. Якщо помилка → 401 Unauthorized, контролер НЕ викликається
 */
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
