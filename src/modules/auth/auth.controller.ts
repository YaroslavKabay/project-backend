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
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { RefreshDto } from './dto/refresh.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
  LoginResponse,
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
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: AuthenticatedRequest,
  ): Promise<LoginResponse> {
    const userAgent = req.headers['user-agent'];
    // Безпечне отримання IP адреси
    const ipAddress = this.getClientIp(req);

    return await this.authService.register(registerDto, userAgent, ipAddress);
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
   *
   * 🛡️ Rate Limiting: 5 спроб на хвилину (захист від brute force)
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 спроб за 60 секунд
  @UseGuards(ThrottlerGuard, LocalAuthGuard) // 🛡️ Rate Limiter + Passport Guard
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Request() req: AuthenticatedRequest): Promise<LoginResponse> {
    const userAgent = req.headers['user-agent'];
    // Безпечне отримання IP адреси
    const ipAddress = this.getClientIp(req);

    // req.user УЖЕ перевірений LocalStrategy!
    return await this.authService.login(req.user, userAgent, ipAddress);
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
  getProfile(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    // user УЖЕ завантажений з БД через JwtStrategy!
    return user;
  }

  /**
   * 🔄 REFRESH - ОНОВЛЕННЯ ACCESS ТОКЕНУ
   * POST /auth/refresh
   * Body: { refresh_token: "..." }
   *
   * Перевіряє refresh токен і видає новий access токен
   * Користувач не втрачає сесію при експірації access токену
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(@Body() refreshDto: RefreshDto): Promise<{
    access_token: string;
    user: AuthenticatedUser;
  }> {
    return await this.authService.refreshAccessToken(refreshDto.refresh_token);
  }

  /**
   * 🚪 LOGOUT - ВИЙТИ З АКАУНТУ (СТАНДАРТНИЙ ПІДХІД)
   * POST /auth/logout
   * Headers: Authorization: Bearer <jwt_token>
   * Body: { refresh_token: "..." }
   *
   * Відкликає refresh токен в БД - користувач не зможе оновити access токен
   * Access токен залишається валідним до експірації (max 2h)
   */
  @UseGuards(JwtAuthGuard) // 🛡️ Тільки залогінені можуть вийти
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Body('refresh_token') refreshToken?: string,
  ): Promise<{ message: string }> {
    // Відкликаємо refresh токен користувача
    await this.authService.revokeRefreshToken(user.id, refreshToken);

    return {
      message: 'Ви успішно вийшли з акаунту',
    };
  }

  /**
   * 🔍 БЕЗПЕЧНЕ ОТРИМАННЯ IP АДРЕСИ КЛІЄНТА
   * Перевіряє різні джерела IP в порядку пріоритету
   */
  private getClientIp(req: AuthenticatedRequest): string {
    // 1. Спробуємо req.ip (стандартний Express спосіб)
    const requestIp = req.ip;
    if (requestIp && typeof requestIp === 'string') {
      return requestIp;
    }

    // 2. Перевіримо headers для proxy
    const forwardedFor = req.headers['x-forwarded-for'] as string | undefined;
    if (forwardedFor) {
      // Беремо перший IP з списку (може бути кілька через proxy)
      return forwardedFor.split(',')[0].trim();
    }

    // 3. Fallback - 'unknown' якщо нічого не знайшли
    return 'unknown';
  }
}
