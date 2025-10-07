import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';

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
   * ЛОГІН КОРИСТУВАЧА
   * POST /auth/login
   * Body: { email, password }
   *
   * ПОКИ БЕЗ PASSPORT GUARD - додамо пізніше
   * Зараз робимо простий варіант для тестування
   */
  @Post('login')
  @HttpCode(HttpStatus.OK) // 200 OK
  async login(@Body() loginDto: LoginDto) {
    const { email, password } = loginDto;

    // 1. ВАЛІДУЄМО КОРИСТУВАЧА
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      // Повертаємо загальну помилку (не розкриваємо чи email існує)
      throw new UnauthorizedException('Невірний email або пароль');
    }

    // 2. ГЕНЕРУЄМО JWT ТОКЕН
    return this.authService.login(user);
  }
}
