import { Request } from 'express';

/**
 * 👤 ТИПІЗОВАНИЙ КОРИСТУВАЧ БЕЗ SENSITIVE ДАНИХ
 * Використовується у відповідях API та req.user
 */
export interface AuthenticatedUser {
  id: number;
  email: string;
  name: string;
  surname: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  balance: number;
  phone?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 📨 REQUEST З АВТЕНТИФІКОВАНИМ КОРИСТУВАЧЕМ
 * Для використання в контролерах з @UseGuards()
 * Включає поля Express для отримання IP та user agent
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
  ip: string; // IP користувача (з Express middleware) - змінюємо на required
}

/**
 * 🎫 JWT PAYLOAD INTERFACE
 * Структура даних всередині JWT токену
 */
export interface JwtPayload {
  sub: number; // User ID
  email: string;
  role: 'ADMIN' | 'USER' | 'MANAGER';
  iat?: number; // issued at
  exp?: number; // expires at
}

/**
 * 🔄 REFRESH TOKEN PAYLOAD
 * Мінімальна інформація для refresh токенів
 */
export interface RefreshTokenPayload {
  sub: number; // User ID
  tokenId: number; // RefreshToken.id в БД для валідації
  iat?: number;
  exp?: number;
}

/**
 * 🔧 AUTH SERVICE RESULT (INTERNAL)
 * Внутрішній результат AuthService з токенами для Controller
 */
export interface AuthServiceResult {
  message: string;
  access_token: string; // Для встановлення в HTTP-only cookie
  refresh_token: string; // Для встановлення в HTTP-only cookie
  user: AuthenticatedUser;
}

/**
 * 🔒 LOGIN API RESPONSE (PUBLIC)
 * Публічний API response з максимальною безпекою (токени в HTTP-only cookies)
 */
export interface LoginApiResponse {
  message: string;
  access_token: string; // ← SDK-friendly: повертаємо в response body
  user: AuthenticatedUser;
  // Refresh token залишається в HTTP-only cookie (hybrid підхід)
}
