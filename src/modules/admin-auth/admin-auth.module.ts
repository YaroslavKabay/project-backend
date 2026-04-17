import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminAuthController } from './admin-auth.controller';
import { AdminAuthService } from './admin-auth.service';
import { AdminJwtStrategy } from './strategies/admin-jwt.strategy';
import { AdminJwtAuthGuard } from './guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from './guards/admin-roles.guard';
import { CookieService } from '../auth/services/cookie.service';
import { adminJwtConfig } from '../../config/admin-jwt.config';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    PassportModule,
    JwtModule.register(adminJwtConfig),
    PrismaModule,
  ],
  controllers: [AdminAuthController],
  providers: [
    AdminAuthService,
    AdminJwtStrategy,
    AdminJwtAuthGuard,
    AdminRolesGuard,
    CookieService,
  ],
  exports: [AdminAuthService, AdminJwtAuthGuard, AdminRolesGuard],
})
export class AdminAuthModule {}
