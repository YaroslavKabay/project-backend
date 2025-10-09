import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../types/auth.types';

/**
 * 🚪 LOCAL STRATEGY - для login через email/password
 *
 * Як працює:
 * 1. Passport автоматично бере email/password з req.body
 * 2. Викликає наш validate() метод
 * 3. Якщо validate повертає user - login успішний
 * 4. Якщо validate кидає exception - login неуспішний
 */
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'email', // Вказуємо що username = email
      passwordField: 'password', // password поле (за замовчуванням)
    });
  }

  /**
   * 🔍 ВАЛІДАЦІЯ КОРИСТУВАЧА
   * Passport автоматично викликає цей метод при login
   */
  async validate(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.authService.validateUser(email, password);

    if (!user) {
      throw new UnauthorizedException('Невірний email або пароль');
    }

    // Повертаємо user - він потрапить в req.user
    return user;
  }
}
