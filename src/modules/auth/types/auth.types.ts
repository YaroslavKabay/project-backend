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
 * 🎯 LOGIN RESPONSE
 * Відповідь при успішному логіні з двома токенами
 */
export interface LoginResponse {
  message: string;
  access_token: string; // Короткий токен (2h) - для API запитів
  refresh_token: string; // Довгий токен (14d) - для оновлення
  user: AuthenticatedUser;
}
