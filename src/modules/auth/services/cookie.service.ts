import { Injectable } from '@nestjs/common';
import type { Response, Request } from 'express';

/**
 * 🍪 COOKIE SERVICE - HYBRID підхід для HTTP-only cookies
 *
 * Відповідальність:
 * - Встановлення ТІЛЬКИ refresh токенів в HTTP-only cookies
 * - Access token тепер в response body (SDK контролює)
 * - Очищення refresh cookie при logout
 * - Централізована конфігурація безпеки cookies
 * - Консистентні налаштування у всьому додатку
 */
@Injectable()
export class CookieService {
  /**
   * 🍪 Базові налаштування безпеки для всіх cookies
   *
   * ⚠️ SameSite=None для production: фронт (Vercel) і бек (Railway) — різні домени.
   * З SameSite=Strict браузер НЕ відправляє cookie при cross-origin запитах.
   * SameSite=None вимагає Secure=true (HTTPS).
   */
  private readonly cookieOptions = {
    httpOnly: true, // JavaScript НЕ може прочитати (захист від XSS)
    secure: process.env.NODE_ENV === 'production', // HTTPS тільки в продакшні
    sameSite:
      process.env.NODE_ENV === 'production'
        ? ('none' as const)
        : ('strict' as const),
  };

  /**
   * 🔄 Встановлює ТІЛЬКИ refresh token в HTTP-only cookie (HYBRID підхід)
   * Access token тепер повертається в response body для SDK
   */
  setRefreshToken(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      ...this.cookieOptions,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 днів в мілісекундах
    });
  }

  setAdminRefreshToken(res: Response, refreshToken: string): void {
    res.cookie('refresh_token', refreshToken, {
      ...this.cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 днів
    });
  }

  /**
   * 🗑️ Очищує refresh token cookie (HYBRID підхід)
   * Access token не очищуємо, бо він в SDK memory
   */
  clearRefreshToken(res: Response): void {
    res.clearCookie('refresh_token', this.cookieOptions);
  }

  /**
   * 📖 Читає refresh token з HTTP-only cookies
   */
  getRefreshToken(req: Request): string | undefined {
    return req.cookies?.refresh_token as string | undefined;
  }
}
