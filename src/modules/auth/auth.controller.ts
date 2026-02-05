import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  Request,
  Get,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response } from 'express';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { CookieService } from './services/cookie.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type {
  AuthenticatedRequest,
  AuthenticatedUser,
  LoginApiResponse,
  AuthServiceResult,
} from './types/auth.types';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly cookieService: CookieService,
  ) {}

  /**
   * РЕЄСТРАЦІЯ НОВОГО КОРИСТУВАЧА (SECURE HTTP-ONLY COOKIES)
   * POST /auth/register
   * Body: { email, password, name, surname }
   *
   * 🔒 SECURITY UPDATE:
   * - refresh_token встановлюється як HTTP-only cookie
   * - НЕ повертається в response body (захист від XSS)
   * - access_token залишається в response для API запитів
   */
  @Post('register')
  @HttpCode(HttpStatus.CREATED) // 201 Created
  async register(
    @Body() registerDto: RegisterDto,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginApiResponse> {
    const userAgent = req.headers['user-agent'];
    // Безпечне отримання IP адреси
    const ipAddress = this.getClientIp(req);

    const result: AuthServiceResult = await this.authService.register(
      registerDto,
      userAgent,
      ipAddress,
    );

    // 🍪 ВСТАНОВЛЕННЯ HTTP-ONLY COOKIES (ОБИДВА ТОКЕНИ)
    this.cookieService.setAuthTokens(res, result);

    // 📤 ПОВЕРТАЄМО БЕЗ ТОКЕНІВ (обидва в HTTP-only cookies)
    return {
      message: result.message,
      user: result.user,
    };
  }

  /**
   * 🚪 ЛОГІН КОРИСТУВАЧА (SECURE HTTP-ONLY COOKIES)
   * POST /auth/login
   * Body: { email, password }
   *
   * Passport автоматично:
   * 1. Витягує email/password з req.body
   * 2. Викликає LocalStrategy.validate()
   * 3. Якщо OK → req.user = user
   * 4. Якщо помилка → 401 Unauthorized
   *
   * 🔒 SECURITY UPDATE:
   * - refresh_token встановлюється як HTTP-only cookie
   * - НЕ повертається в response body (захист від XSS)
   * - access_token залишається в response для API запитів
   *
   * 🛡️ Rate Limiting: 5 спроб на хвилину (захист від brute force)
   */
  @Throttle({ default: { limit: 5, ttl: 60000 } }) // 5 спроб за 60 секунд
  @UseGuards(ThrottlerGuard, LocalAuthGuard) // 🛡️ Rate Limiter + Passport Guard
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginApiResponse> {
    const userAgent = req.headers['user-agent'];
    // Безпечне отримання IP адреси
    const ipAddress = this.getClientIp(req);

    // req.user УЖЕ перевірений LocalStrategy!
    const result: AuthServiceResult = await this.authService.login(
      req.user,
      userAgent,
      ipAddress,
    );

    // 🍪 ВСТАНОВЛЕННЯ HTTP-ONLY COOKIES (ОБИДВА ТОКЕНИ)
    this.cookieService.setAuthTokens(res, result);

    // 📤 ПОВЕРТАЄМО БЕЗ ТОКЕНІВ (обидва в HTTP-only cookies)
    return {
      message: result.message,
      user: result.user,
    };
  }

  /**
   * 🎫 ЗАХИЩЕНИЙ РОУТ - ПРОФІЛЬ КОРИСТУВАЧА (HTTP-ONLY COOKIES)
   * GET /auth/profile
   * Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
   *
   * Passport автоматично:
   * 1. Витягує JWT токен з HTTP-only cookie 'access_token'
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
   * 🔄 REFRESH - ОНОВЛЕННЯ ACCESS ТОКЕНУ (SECURE HTTP-ONLY COOKIES)
   * POST /auth/refresh
   * Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
   *
   * 🔒 SECURITY UPDATE:
   * - refresh_token читається з HTTP-only cookie
   * - НОВИЙ access_token встановлюється в HTTP-only cookie
   * - НЕ потрібно передавати в request body (захист від XSS)
   * - Браузер автоматично додає cookie до запиту
   *
   * Перевіряє refresh токен і видає новий access токен в cookies
   * Користувач не втрачає сесію при експірації access токену
   */
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshToken(
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{
    message: string;
    user: AuthenticatedUser;
  }> {
    // 🍪 ЧИТАННЯ REFRESH TOKEN З HTTP-ONLY COOKIE
    const refreshToken = this.cookieService.getRefreshToken(req);

    if (!refreshToken) {
      throw new UnauthorizedException({
        message: 'Refresh токен не знайдено в cookies',
        error: 'MISSING_REFRESH_TOKEN',
        statusCode: 401,
      });
    }

    const result = await this.authService.refreshAccessToken(refreshToken);

    // 🍪 ВСТАНОВЛЕННЯ НОВОГО ACCESS TOKEN В HTTP-ONLY COOKIE
    this.cookieService.setAccessToken(res, result.access_token);

    // 📤 ПОВЕРТАЄМО БЕЗ ТОКЕНУ (він в HTTP-only cookie)
    return {
      message: 'Access токен успішно оновлено',
      user: result.user,
    };
  }

  /**
   * 🚪 LOGOUT - ВИЙТИ З АКАУНТУ (FULL HTTP-ONLY COOKIES)
   * POST /auth/logout
   * Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
   * Cookie: refresh_token=...; HttpOnly; Secure; SameSite=Strict
   *
   * 🔒 SECURITY UPDATE:
   * - ОБА токени читаються з HTTP-only cookies
   * - ОБА cookies автоматично очищаються після logout
   * - Максимальний захист від XSS атак
   *
   * Відкликає refresh токен в БД та очищає обидва HTTP-only cookies
   * Користувач одразу втрачає доступ до всіх захищених endpoints
   */
  @UseGuards(JwtAuthGuard) // 🛡️ Тільки залогінені можуть вийти
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Request() req: AuthenticatedRequest,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    // 🍪 ЧИТАННЯ REFRESH TOKEN З HTTP-ONLY COOKIE
    const refreshToken = this.cookieService.getRefreshToken(req);

    // Відкликаємо refresh токен користувача (навіть якщо cookie відсутній)
    await this.authService.revokeRefreshToken(user.id, refreshToken);

    // 🗑️ ОЧИЩЕННЯ ОБОХ HTTP-ONLY COOKIES
    this.cookieService.clearAuthTokens(res);

    return {
      message: 'Ви успішно вийшли з акаунту',
    };
  }

  /**
   * 🔐 ЗМІНА ПАРОЛЮ АВТОРИЗОВАНОГО КОРИСТУВАЧА (HTTP-ONLY COOKIES)
   * POST /auth/change-password
   * Cookie: access_token=...; HttpOnly; Secure; SameSite=Strict
   * Body: { current_password, new_password }
   *
   * Безпека:
   * - Тільки авторизовані користувачі (JwtAuthGuard з HTTP-only cookie)
   * - Перевірка поточного паролю
   * - Валідація нового паролю
   */
  @UseGuards(JwtAuthGuard) // 🛡️ Тільки авторизовані
  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.changePassword(user.id, changePasswordDto);
  }

  /**
   * 📧 ЗАПИТ НА ВІДНОВЛЕННЯ ПАРОЛЮ
   * POST /auth/forgot-password
   * Body: { email }
   *
   * 🛡️ Rate Limiting: 3 спроби на 5 хвилин (захист від spam)
   * 📧 Email: Відправляє reset link на email
   * 🛡️ Безпека: Токен НІКОЛИ не повертається в API відповіді
   * ⚠️ Помилка: Якщо email сервіс не працює - кидає BadRequestException
   */
  @Throttle({ default: { limit: 3, ttl: 300000 } }) // 3 спроби за 5 хвилин
  @UseGuards(ThrottlerGuard) // 🛡️ Rate Limiter
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.forgotPassword(forgotPasswordDto.email);
  }

  /**
   * 🔄 ВІДНОВЛЕННЯ ПАРОЛЮ ЗА ТОКЕНОМ
   * POST /auth/reset-password
   * Body: { token, new_password }
   *
   * 🔐 Безпека:
   * - Перевірка валідності токена
   * - Одноразове використання токена
   * - 15 хвилин експірація
   * - Відкликання всіх refresh токенів
   */
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    return await this.authService.resetPassword(resetPasswordDto);
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
