import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { jwtConfig } from '../../config/jwt.config';

@Module({
  imports: [
    // JWT MODULE - налаштування токенів
    JwtModule.register(jwtConfig),
  ],
  controllers: [AuthController],
  providers: [AuthService],
  exports: [AuthService], // Експортуємо для використання в інших модулях
})
export class AuthModule {}
