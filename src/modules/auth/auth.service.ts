import { Injectable, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser, JwtPayload } from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * РЕЄСТРАЦІЯ НОВОГО КОРИСТУВАЧА
   * 1. Перевіряє чи email вже існує
   * 2. Хешує пароль за допомогою bcrypt
   * 3. Створює користувача в БД
   * 4. Повертає користувача БЕЗ паролю
   */
  async register(registerDto: RegisterDto) {
    const { email, password, name, surname } = registerDto;

    // 1. ПЕРЕВІРЯЄМО ЧИ EMAIL ВЖЕ ІСНУЄ
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('Користувач з таким email вже існує');
    }

    // 2. ХЕШУЄМО ПАРОЛЬ (10 раундів - оптимально для безпеки/швидкості)
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // 3. СТВОРЮЄМО КОРИСТУВАЧА В БД
    const user = await this.prisma.user.create({
      data: {
        email,
        name,
        surname,
        passwordHash: hashedPassword,
        // role за замовчуванням = USER (з Prisma schema)
        // balance за замовчуванням = 0 (з Prisma schema)
      },
      select: {
        // ПОВЕРТАЄМО ВСЕ ОКРІМ ПАРОЛЮ (безпека!)
        id: true,
        email: true,
        name: true,
        surname: true,
        role: true,
        balance: true,
        createdAt: true,
      },
    });

    return {
      message: 'Користувач успішно зареєстрований',
      user,
    };
  }

  /**
   * ВАЛІДАЦІЯ КОРИСТУВАЧА (для Passport Local Strategy)
   * 1. Знаходить користувача по email
   * 2. Порівнює пароль з хешем в БД
   * 3. Повертає користувача або null
   */
  async validateUser(
    email: string,
    password: string,
  ): Promise<AuthenticatedUser | null> {
    // 1. ЗНАХОДИМО КОРИСТУВАЧА ПО EMAIL
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return null; // Користувач не знайдений
    }

    // 2. ПОРІВНЮЄМО ПАРОЛЬ З ХЕШЕМ
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return null; // Пароль невірний
    }

    // 3. ПОВЕРТАЄМО КОРИСТУВАЧА БЕЗ ПАРОЛЮ
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { passwordHash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * ЛОГІН КОРИСТУВАЧА
   * 1. Отримує валідного користувача
   * 2. Створює JWT payload
   * 3. Генерує access token
   * 4. Повертає токен + дані користувача
   */
  login(user: AuthenticatedUser) {
    // 1. СТВОРЮЄМО JWT PAYLOAD
    const payload: JwtPayload = {
      sub: user.id, // User ID (стандартне поле JWT)
      email: user.email,
      role: user.role,
    };

    // 2. ГЕНЕРУЄМО ACCESS TOKEN
    const accessToken = this.jwtService.sign(payload);

    return {
      message: 'Успішний вхід',
      access_token: accessToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        surname: user.surname,
        role: user.role,
        balance: user.balance,
      },
    };
  }
}
