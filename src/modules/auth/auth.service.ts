import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { refreshTokenConfig } from '../../config/jwt.config';
import {
  AuthenticatedUser,
  JwtPayload,
  RefreshTokenPayload,
  LoginResponse,
} from './types/auth.types';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * 🎯 РЕЄСТРАЦІЯ НОВОГО КОРИСТУВАЧА (ОНОВЛЕНО: автологін)
   * 1. Перевіряє чи email вже існує
   * 2. Хешує пароль за допомогою bcrypt
   * 3. Створює користувача в БД
   * 4. АВТОМАТИЧНО ЛОГІНИТЬ (повертає 2 токени)
   */
  async register(
    registerDto: RegisterDto,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
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
        phone: true, // Додаю відсутнє поле
        createdAt: true,
        updatedAt: true, // Додаю відсутнє поле
      },
    });

    // 4. АВТОМАТИЧНО ЛОГІНИМО НОВОГО КОРИСТУВАЧА
    const loginResponse = await this.login(
      user as AuthenticatedUser,
      userAgent,
      ipAddress,
    );

    return {
      ...loginResponse,
      message: 'Користувач успішно зареєстрований та залогінений',
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
   * 🔄 ГЕНЕРУЄ REFRESH TOKEN і зберігає в БД
   * 1. Створює запис в БД з експірацією через 14 днів
   * 2. Генерує JWT з tokenId для валідації
   * 3. Повертає підписаний refresh token
   */
  private async generateRefreshToken(
    userId: number,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<string> {
    // 1. ОБЧИСЛЮЄМО ДАТУ ЕКСПІРАЦІЇ (14 днів)
    const expiresAt = new Date();
    const expirationDays = parseInt(
      refreshTokenConfig.expiresIn.replace('d', ''),
      10,
    );
    expiresAt.setDate(expiresAt.getDate() + expirationDays);

    // 2. СТВОРЮЄМО ЗАПИС В БД
    const refreshTokenRecord = await this.prisma.refreshToken.create({
      data: {
        token: crypto.randomBytes(32).toString('hex'),
        userId,
        expiresAt,
        userAgent,
        ipAddress,
        status: 'ACTIVE',
      },
    });

    // 3. СТВОРЮЄМО JWT PAYLOAD з tokenId
    const tokenId = refreshTokenRecord.id;
    const payload: RefreshTokenPayload = {
      sub: userId,
      tokenId,
    };

    // 4. ГЕНЕРУЄМО ПІДПИСАНИЙ JWT
    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshTokenConfig.secret,
      expiresIn: refreshTokenConfig.expiresIn,
      issuer: refreshTokenConfig.issuer,
      audience: refreshTokenConfig.audience,
    });

    // 5. ОНОВЛЮЄМО ЗАПИС З РЕАЛЬНИМ ТОКЕНОМ (хеш для безпеки)
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    await this.prisma.refreshToken.update({
      where: { id: tokenId },
      data: { token: tokenHash },
    });

    return refreshToken;
  }

  /**
   * 🚫 ВІДКЛИКАЄ REFRESH TOKEN (стандартний logout)
   * 1. Якщо передано конкретний токен - відкликає його
   * 2. Якщо токен не передано - відкликає ВСІ токени користувача
   */
  async revokeRefreshToken(
    userId: number,
    refreshToken?: string,
  ): Promise<void> {
    if (refreshToken) {
      // Відкликаємо конкретний токен
      const tokenHash = crypto
        .createHash('sha256')
        .update(refreshToken)
        .digest('hex');

      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          token: tokenHash,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
        },
      });
    } else {
      // Відкликаємо ВСІ active токени користувача (logout з усіх пристроїв)
      await this.prisma.refreshToken.updateMany({
        where: {
          userId,
          status: 'ACTIVE',
        },
        data: {
          status: 'REVOKED',
        },
      });
    }
  }

  /**
   * 🔄 ОНОВЛЮЄ ACCESS TOKEN за допомогою refresh token
   * 1. Перевіряє refresh token в БД (активний, не прострочений)
   * 2. Знаходить користувача
   * 3. Генерує новий access token
   * 4. Оновлює lastUsed дату refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<{
    access_token: string;
    user: AuthenticatedUser;
  }> {
    // 1. ХЕШУЄМО REFRESH TOKEN для пошуку в БД
    const tokenHash = crypto
      .createHash('sha256')
      .update(refreshToken)
      .digest('hex');

    // 2. ШУКАЄМО REFRESH TOKEN В БД
    const refreshTokenRecord = await this.prisma.refreshToken.findFirst({
      where: {
        token: tokenHash,
        status: 'ACTIVE',
        expiresAt: {
          gte: new Date(), // Токен ще не прострочений
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            surname: true,
            role: true,
            balance: true,
            phone: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });

    if (!refreshTokenRecord) {
      throw new UnauthorizedException(
        'Refresh токен недійсний або прострочений',
      );
    }

    // 3. СТВОРЮЄМО НОВИЙ ACCESS TOKEN
    const userId = refreshTokenRecord.user.id;
    const userEmail = refreshTokenRecord.user.email;
    const userRole = refreshTokenRecord.user.role;

    const jwtPayload: JwtPayload = {
      sub: userId,
      email: userEmail,
      role: userRole,
    };

    const newAccessToken = this.jwtService.sign(jwtPayload);

    // 4. ОНОВЛЮЄМО LAST USED ДАТУ
    const recordId = refreshTokenRecord.id;
    await this.prisma.refreshToken.update({
      where: { id: recordId },
      data: { lastUsed: new Date() },
    });

    const userRecord = refreshTokenRecord.user;
    return {
      access_token: newAccessToken,
      user: userRecord,
    };
  }

  /**
   * 🚪 ЛОГІН КОРИСТУВАЧА (ОНОВЛЕНО: 2 токени)
   * 1. Отримує валідного користувача
   * 2. Генерує ACCESS TOKEN (2h) для API запитів
   * 3. Генерує REFRESH TOKEN (14d) і зберігає в БД
   * 4. Повертає обидва токени + дані користувача
   */
  async login(
    user: AuthenticatedUser,
    userAgent?: string,
    ipAddress?: string,
  ): Promise<LoginResponse> {
    // 1. СТВОРЮЄМО JWT PAYLOAD для ACCESS TOKEN
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 2. ГЕНЕРУЄМО ACCESS TOKEN (короткий)
    const accessToken = this.jwtService.sign(jwtPayload);

    // 3. ГЕНЕРУЄМО та ЗБЕРІГАЄМО REFRESH TOKEN (довгий)
    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    return {
      message: 'Успішний вхід',
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }
}
