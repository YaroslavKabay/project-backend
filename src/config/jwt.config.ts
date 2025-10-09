import { JwtModuleOptions } from '@nestjs/jwt';

export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET || 'dev-fallback-secret-key',
  signOptions: {
    expiresIn: '24h', // Токен дійсний 24 години
    issuer: 'project-backend', // Хто видав токен
    audience: 'project-frontend', // Для кого призначений токен
  },
};
