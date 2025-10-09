import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
} from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * РЕЄСТРАЦІЯ НОВОГО КОРИСТУВАЧА
   * POST /auth/register
   * Body: { email, password, name, surname }
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // 201 Created
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.register(registerDto);
  }

  /**
   * 🚪 ЛОГІН КОРИСТУВАЧА (PASSPORT VERSION)
   * POST /auth/login
   * Body: { email, password }
   *
   * Passport автоматично:
   * 1. Витягує email/password з req.body
   * 2. Викликає LocalStrategy.validate()
   * 3. Якщо OK → req.user = user
   * 4. Якщо помилка → 401 Unauthorized
   */

  @UseGuards(LocalAuthGuard) // 🛡️ Passport Guard
  @Post('login')
  @HttpCode(HttpStatus.OK)
  login(@Request() req: AuthenticatedRequest) {
    // req.user УЖЕ перевірений LocalStrategy!
    return this.authService.login(req.user);
  }

  /**
   * 🎫 ЗАХИЩЕНИЙ РОУТ - ПРОФІЛЬ КОРИСТУВАЧА
   * GET /auth/profile
   * Headers: Authorization: Bearer <jwt_token>
   *
   * Passport автоматично:
   * 1. Витягує JWT токен з Authorization header
   * 2. Викликає JwtStrategy.validate()
   * 3. Завантажує користувача з БД
   * 4. Якщо OK → req.user = user
   * 5. Якщо помилка → 401 Unauthorized
   */

  @UseGuards(JwtAuthGuard) // 🛡️ JWT Guard
  @Get('profile')
  getProfile(@Request() req: AuthenticatedRequest): AuthenticatedUser {
    // req.user УЖЕ завантажений з БД через JwtStrategy!
    return req.user;
  }
}
