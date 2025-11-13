import {
  IsString,
  MaxLength,
  IsStrongPassword,
  IsNotEmpty,
} from 'class-validator';

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
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1, // Хоча б 1 мала літера
      minUppercase: 1, // Хоча б 1 велика літера
      minNumbers: 1, // Хоча б 1 цифра
      minSymbols: 1, // Хоча б 1 спецсимвол
    },
    {
      message:
        'Пароль повинен містити мінімум 8 символів, велику та малу літери, цифру та спецсимвол',
    },
  )
  @MaxLength(50, { message: 'Пароль не може бути довшим 50 символів' })
  password: string;
}

/**
 * 🔄 КЛАС ДЛЯ НОВОГО ПАРОЛЮ (change-password, reset-password)
 */
export class NewPasswordValidationMixin {
  @IsString({ message: 'Новий пароль повинен бути рядком' })
  @IsNotEmpty({ message: "Новий пароль обов'язковий" })
  @IsStrongPassword(
    {
      minLength: 8,
      minLowercase: 1, // Хоча б 1 мала літера
      minUppercase: 1, // Хоча б 1 велика літера
      minNumbers: 1, // Хоча б 1 цифра
      minSymbols: 1, // Хоча б 1 спецсимвол
    },
    {
      message:
        'Новий пароль повинен містити мінімум 8 символів, велику та малу літери, цифру та спецсимвол',
    },
  )
  @MaxLength(50, { message: 'Новий пароль не може бути довшим 50 символів' })
  new_password: string;
}
