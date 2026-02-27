import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { EmailService } from '../email/email.service';
import { refreshTokenConfig } from '../../config/jwt.config';
import {
  AuthenticatedUser,
  JwtPayload,
  RefreshTokenPayload,
  AuthServiceResult,
} from './types/auth.types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  // ================================
  // 🔧 ПРИВАТНІ UTILITY МЕТОДИ
  // ================================

  /**
   * 🔐 ХЕШУЄ ПАРОЛЬ за допомогою bcrypt
   * Централізована логіка для всіх операцій з паролями
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10; // Оптимально для безпеки/швидкості
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * 🎫 ГЕНЕРУЄ ACCESS TOKEN
   * Централізована логіка для створення JWT
   */
  private generateAccessToken(payload: JwtPayload): string {
    return this.jwtService.sign(payload);
  }

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
  ): Promise<AuthServiceResult> {
    const { email, password, name, surname } = registerDto;

    // 1. ПЕРЕВІРЯЄМО ЧИ EMAIL ВЖЕ ІСНУЄ
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      this.logger.warn(`Registration failed: Email already exists - ${email}`);
      throw new ConflictException('Користувач з таким email вже існує');
    }

    // 2. ХЕШУЄМО ПАРОЛЬ
    const hashedPassword = await this.hashPassword(password);

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
    this.logger.log(`✅ New user registered and logged in: ${email}`);

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
      this.logger.warn(`Validation failed: User not found - ${email}`);
      return null; // Користувач не знайдений
    }

    // 2. ПОРІВНЮЄМО ПАРОЛЬ З ХЕШЕМ
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      this.logger.warn(`Validation failed: Invalid password for - ${email}`);
      return null; // Пароль невірний
    }

    // 3. ПОВЕРТАЄМО КОРИСТУВАЧА БЕЗ ПАРОЛЮ
    this.logger.log(`✅ User validation successful: ${email}`);
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
      this.logger.warn(
        `Refresh token validation failed: Invalid or expired token`,
      );
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

    const newAccessToken = this.generateAccessToken(jwtPayload);

    // 4. ОНОВЛЮЄМО LAST USED ДАТУ
    const recordId = refreshTokenRecord.id;
    await this.prisma.refreshToken.update({
      where: { id: recordId },
      data: { lastUsed: new Date() },
    });

    const userRecord = refreshTokenRecord.user;
    this.logger.log(`✅ Access token refreshed for user: ${userRecord.email}`);

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
  ): Promise<AuthServiceResult> {
    // 1. СТВОРЮЄМО JWT PAYLOAD для ACCESS TOKEN
    const jwtPayload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    // 2. ГЕНЕРУЄМО ACCESS TOKEN (короткий)
    const accessToken = this.generateAccessToken(jwtPayload);

    // 3. ГЕНЕРУЄМО та ЗБЕРІГАЄМО REFRESH TOKEN (довгий)
    const refreshToken = await this.generateRefreshToken(
      user.id,
      userAgent,
      ipAddress,
    );

    this.logger.log(`✅ User logged in successfully: ${user.email}`);

    return {
      message: 'Успішний вхід',
      access_token: accessToken,
      refresh_token: refreshToken,
      user,
    };
  }

  /**
   * 🔐 ЗМІНА ПАРОЛЮ АВТОРИЗОВАНОГО КОРИСТУВАЧА
   * 1. Знаходить користувача в БД за ID
   * 2. Перевіряє поточний пароль
   * 3. Хешує новий пароль
   * 4. Оновлює пароль в БД
   */
  async changePassword(
    userId: number,
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const { current_password, new_password } = changePasswordDto;

    // 1. ЗНАХОДИМО КОРИСТУВАЧА В БД
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      this.logger.error(
        `Password change failed: User not found with ID ${userId}`,
      );
      throw new NotFoundException('Користувач не знайдений');
    }

    // 2. ПЕРЕВІРЯЄМО ПОТОЧНИЙ ПАРОЛЬ
    const isCurrentPasswordValid = await bcrypt.compare(
      current_password,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      this.logger.warn(
        `Password change failed: Invalid current password for user ID ${userId}`,
      );
      throw new BadRequestException('Поточний пароль невірний');
    }

    // 3. ПЕРЕВІРЯЄМО ЩО НОВИЙ ПАРОЛЬ ВІДРІЗНЯЄТЬСЯ ВІД ПОТОЧНОГО
    const isSamePassword = await bcrypt.compare(
      new_password,
      user.passwordHash,
    );
    if (isSamePassword) {
      this.logger.warn(
        `Password change failed: New password same as current for user ID ${userId}`,
      );
      throw new BadRequestException(
        'Новий пароль не може бути таким же як поточний',
      );
    }

    // 4. ХЕШУЄМО НОВИЙ ПАРОЛЬ
    const hashedNewPassword = await this.hashPassword(new_password);

    // 5. ОНОВЛЮЄМО ПАРОЛЬ В БД
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: hashedNewPassword },
    });

    this.logger.log(`✅ Password changed successfully for user ID: ${userId}`);

    return {
      message: 'Пароль успішно змінено',
    };
  }

  /**
   * 📧 ВІДПРАВЛЯЄ EMAIL ДЛЯ ВІДНОВЛЕННЯ ПАРОЛЮ
   * 1. Знаходить користувача по email (безпечно - не розкриває чи існує)
   * 2. Видаляє старі використані reset токени
   * 3. Генерує новий унікальний токен (UUID)
   * 4. Зберігає в БД з експірацією 15 хвилин
   * 5. Відправляє email з посиланням
   */
  async forgotPassword(email: string): Promise<{
    message: string;
  }> {
    // 1. ЗНАХОДИМО КОРИСТУВАЧА ПО EMAIL
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // 🛡️ БЕЗПЕКА: Не розкриваємо чи email існує
      this.logger.warn(
        `Forgot password request for non-existent email: ${email}`,
      );
      return {
        message:
          'Якщо email існує в системі, ми відправили посилання для відновлення',
      };
    }

    // 2. ВИДАЛЯЄМО СТАРІ ВИКОРИСТАНІ RESET ТОКЕНИ (cleanup)
    await this.prisma.passwordResetToken.deleteMany({
      where: {
        userId: user.id,
        used: true,
      },
    });

    // 3. ГЕНЕРУЄМО УНІКАЛЬНИЙ RESET ТОКЕН
    const resetToken = crypto.randomUUID(); // Криптографічно стійкий

    // 4. ОБЧИСЛЮЄМО ДАТУ ЕКСПІРАЦІЇ (15 хвилин)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 15);

    // 5. ЗБЕРІГАЄМО ТОКЕН В БД
    await this.prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt,
      },
    });

    // 6. ВІДПРАВЛЯЄМО EMAIL (якщо можливо)
    const emailSent = await this.emailService.sendPasswordResetEmail(
      email,
      resetToken,
      user.name, // Додаємо ім'я користувача для персоналізації
    );

    if (emailSent) {
      this.logger.log(`✅ Password reset email sent successfully to: ${email}`);
      return {
        message: 'Посилання для відновлення паролю відправлено на ваш email',
      };
    } else {
      // 📧 EMAIL СЕРВІС НЕДОСТУПНИЙ - критична помилка
      this.logger.error(`Failed to send password reset email to: ${email}`);
      throw new BadRequestException(
        'Помилка відправки email. Спробуйте пізніше або зверніться до підтримки.',
      );
    }
  }

  /**
   * 🔄 ВІДНОВЛЮЄ ПАРОЛЬ ЗА ТОКЕНОМ
   * 1. Знаходить валідний reset токен в БД
   * 2. Перевіряє що токен не використаний і не прострочений
   * 3. Хешує новий пароль
   * 4. Транзакція: оновлює пароль + позначає токен використаним
   * 5. Відкликає всі refresh токени (безпека)
   */
  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
    message: string;
  }> {
    const { token, new_password } = resetPasswordDto;

    // 1. ЗНАХОДИМО ВАЛІДНИЙ RESET ТОКЕН
    const resetToken = await this.prisma.passwordResetToken.findFirst({
      where: {
        token,
        used: false, // Не використаний
        expiresAt: { gte: new Date() }, // Не прострочений
      },
      include: { user: true },
    });

    if (!resetToken) {
      this.logger.warn(
        `Password reset failed: Invalid or expired token - ${token.substring(0, 8)}...`,
      );
      throw new BadRequestException(
        'Недійсний або прострочений токен відновлення паролю',
      );
    }

    // 2. ХЕШУЄМО НОВИЙ ПАРОЛЬ
    const hashedPassword = await this.hashPassword(new_password);

    // 3. ТРАНЗАКЦІЯ: ОНОВЛЮЄМО ПАРОЛЬ + ПОЗНАЧАЄМО ТОКЕН ВИКОРИСТАНИМ
    await this.prisma.$transaction([
      // Оновлюємо пароль
      this.prisma.user.update({
        where: { id: resetToken.userId },
        data: { passwordHash: hashedPassword },
      }),
      // Позначаємо токен використаним
      this.prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    // 4. ВІДКЛИКАЄМО ВСІ REFRESH ТОКЕНИ (безпека після зміни паролю)
    await this.revokeRefreshToken(resetToken.userId);

    this.logger.log(
      `✅ Password reset successful for user ID: ${resetToken.userId}`,
    );

    return {
      message: 'Пароль успішно відновлено. Увійдіть з новим паролем.',
    };
  }
}
