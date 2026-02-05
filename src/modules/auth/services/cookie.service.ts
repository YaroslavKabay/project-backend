import { Injectable } from '@nestjs/common';
import type { Response, Request } from 'express';
import type { AuthServiceResult } from '../types/auth.types';

/**
 * 🍪 COOKIE SERVICE - централізоване керування HTTP-only cookies
 *
 * Відповідальність:
 * - Встановлення access і refresh токенів в HTTP-only cookies
 * - Очищення cookies при logout
 * - Централізована конфігурація безпеки cookies
 * - Консистентні налаштування у всьому додатку
 */
@Injectable()
export class CookieService {
  /**
   * 🍪 Базові налаштування безпеки для всіх cookies
   */
  private readonly cookieOptions = {
    httpOnly: true, // JavaScript НЕ може прочитати (захист від XSS)
    secure: process.env.NODE_ENV === 'production', // HTTPS тільки в продакшні
    sameSite: 'strict' as const, // Захист від CSRF атак
  };

  /**
   * 🔐 Встановлює ОБИДВА токени (access + refresh) в HTTP-only cookies
   */
  setAuthTokens(res: Response, authResult: AuthServiceResult): void {
    // 🎫 Access Token - короткий термін життя (2 години)
    res.cookie('access_token', authResult.access_token, {
      ...this.cookieOptions,
      maxAge: 2 * 60 * 60 * 1000, // 2 години в мілісекундах
    });

    // 🔄 Refresh Token - довгий термін життя (14 днів)
    res.cookie('refresh_token', authResult.refresh_token, {
      ...this.cookieOptions,
      maxAge: 14 * 24 * 60 * 60 * 1000, // 14 днів в мілісекундах
    });
  }

  /**
   * 🎫 Встановлює ТІЛЬКИ access token в HTTP-only cookie
   * Використовується при refresh операціях
   */
  setAccessToken(res: Response, accessToken: string): void {
    res.cookie('access_token', accessToken, {
      ...this.cookieOptions,
      maxAge: 2 * 60 * 60 * 1000, // 2 години в мілісекундах
    });
  }

  /**
   * 🗑️ Очищує ВСІ authentication cookies
   * Використовується при logout
   */
  clearAuthTokens(res: Response): void {
    res.clearCookie('access_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });

    res.clearCookie('refresh_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    });
  }

  /**
   * 📖 Читає refresh token з HTTP-only cookies
   */
  getRefreshToken(req: Request): string | undefined {
    return req.cookies?.refresh_token as string | undefined;
  }
}
