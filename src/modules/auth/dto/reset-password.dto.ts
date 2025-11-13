import { IsString, IsNotEmpty } from 'class-validator';
import { NewPasswordValidationMixin } from './password-validation.dto';

export class ResetPasswordDto extends NewPasswordValidationMixin {
  @IsString({ message: 'Токен повинен бути рядком' })
  @IsNotEmpty({ message: "Токен обов'язковий" })
  token: string;

  // 🔐 Валідація нового паролю наслідується від NewPasswordValidationMixin
  // Правила: мін 8, макс 50 символів, велика+мала літера, цифра, спецсимвол
}
