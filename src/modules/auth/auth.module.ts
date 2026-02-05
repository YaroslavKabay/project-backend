import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CookieService } from './services/cookie.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { jwtConfig } from '../../config/jwt.config';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    // PASSPORT MODULE - базова конфігурація Passport
    PassportModule,
    // JWT MODULE - налаштування токенів
    JwtModule.register(jwtConfig),
    // EMAIL MODULE - для відправки reset password emails
    EmailModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    CookieService, // 🍪 Централізоване керування HTTP-only cookies
    LocalStrategy, // 🚪 Стратегія для login (email/password)
    JwtStrategy, // 🎫 Стратегія для JWT токенів
  ],
  exports: [AuthService], // Експортуємо для використання в інших модулях
})
export class AuthModule {}
