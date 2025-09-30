import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'dev-fallback-secret-key',
  signOptions: {
    expiresIn: '24h', // Токен дійсний 24 години
    issuer: 'project-backend', // Хто видав токен
    audience: 'project-frontend', // Для кого призначений токен
  },
};

// Тип для JWT payload (що зберігається в токені)
export interface JwtPayload {
  sub: number; // User ID (standard JWT field)
  email: string; // User email
  role: 'ADMIN' | 'USER' | 'MANAGER'; // User role from our enum
  iat?: number; // Issued at (коли видано) - автоматично додається
  exp?: number; // Expires at (коли закінчується) - автоматично додається
}
