import { JwtModuleOptions } from '@nestjs/jwt';

export const adminJwtConfig: JwtModuleOptions = {
  secret: process.env.ADMIN_JWT_SECRET!,
  signOptions: {
    expiresIn: process.env.ADMIN_ACCESS_TOKEN_EXPIRES_IN || '2h',
    issuer: 'project-backend',
    audience: 'project-backoffice',
  },
};

export const adminRefreshTokenConfig = {
  secret: process.env.ADMIN_JWT_SECRET!,
  expiresIn: process.env.ADMIN_REFRESH_TOKEN_EXPIRES_IN || '7d',
};
