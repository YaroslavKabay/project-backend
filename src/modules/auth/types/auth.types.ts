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
 */
export interface AuthenticatedRequest extends Request {
  user: AuthenticatedUser;
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
