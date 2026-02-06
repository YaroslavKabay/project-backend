import {
  IsString,
  MaxLength,
  IsStrongPassword,
  IsNotEmpty,
} from 'class-validator';

// ================================
// 🔐 ЦЕНТРАЛІЗОВАНІ КОНСТАНТИ ВАЛІДАЦІЇ ПАРОЛЮ
// ================================

/**
 * 🔧 Конфігурація сильного паролю для IsStrongPassword
 */
const STRONG_PASSWORD_CONFIG = {
  minLength: 8,
  minLowercase: 1, // Хоча б 1 мала літера
  minUppercase: 1, // Хоча б 1 велика літера
  minNumbers: 1, // Хоча б 1 цифра
  minSymbols: 1, // Хоча б 1 спецсимвол
};

/**
 * 📝 Повідомлення про помилку валідації паролю
 */
const PASSWORD_ERROR_MESSAGE =
  'Пароль повинен містити мінімум 8 символів, велику та малу літери, цифру та спецсимвол';

/**
 * 📏 Максимальна довжина паролю
 */
const MAX_PASSWORD_LENGTH = 50;

/**
 * 🔐 СПІЛЬНІ ПРАВИЛА ВАЛІДАЦІЇ ПАРОЛЮ
 * Використовується в RegisterDto, ChangePasswordDto, ResetPasswordDto
 *
 * ПРАВИЛА:
 * - Мінімум 8 символів
 * - Мінімум 1 буква (a-z або A-Z)
 * - Мінімум 1 цифра (0-9)
 * - Дозволені спеціальні символи: !@#$%^&*
 */
export class PasswordValidationMixin {
  @IsString({ message: 'Пароль повинен бути рядком' })
  @IsNotEmpty({ message: "Пароль обов'язковий" })
  @IsStrongPassword(STRONG_PASSWORD_CONFIG, { message: PASSWORD_ERROR_MESSAGE })
  @MaxLength(MAX_PASSWORD_LENGTH, {
    message: `Пароль не може бути довшим ${MAX_PASSWORD_LENGTH} символів`,
  })
  password: string;
}

/**
 * 🔄 КЛАС ДЛЯ НОВОГО ПАРОЛЮ (change-password, reset-password)
 */
export class NewPasswordValidationMixin {
  @IsString({ message: 'Новий пароль повинен бути рядком' })
  @IsNotEmpty({ message: "Новий пароль обов'язковий" })
  @IsStrongPassword(STRONG_PASSWORD_CONFIG, {
    message: 'Новий ' + PASSWORD_ERROR_MESSAGE.toLowerCase(),
  })
  @MaxLength(MAX_PASSWORD_LENGTH, {
    message: `Новий пароль не може бути довшим ${MAX_PASSWORD_LENGTH} символів`,
  })
  new_password: string;
}
