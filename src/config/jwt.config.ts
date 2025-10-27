import { JwtModuleOptions } from '@nestjs/jwt';

// 📝 ІНТЕРФЕЙС ДЛЯ REFRESH TOKEN КОНФІГУРАЦІЇ
interface RefreshTokenConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

// 🎯 ACCESS TOKEN конфігурація (короткий термін)
export const jwtConfig: JwtModuleOptions = {
  secret: process.env.JWT_SECRET!,
  signOptions: {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || '2h', // Короткий токен
    issuer: 'project-backend',
    audience: 'project-frontend',
  },
};

// 🔄 REFRESH TOKEN конфігурація (довгий термін)
export const refreshTokenConfig: RefreshTokenConfig = {
  secret: process.env.JWT_SECRET!, // Той самий секрет
  expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '14d', // Довгий токен
  issuer: 'project-backend',
  audience: 'project-frontend',
};
