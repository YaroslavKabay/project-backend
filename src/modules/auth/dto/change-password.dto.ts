import { IsString, IsNotEmpty } from 'class-validator';
import { NewPasswordValidationMixin } from './password-validation.dto';

export class ChangePasswordDto extends NewPasswordValidationMixin {
  @IsString({ message: 'Поточний пароль повинен бути рядком' })
  @IsNotEmpty({ message: "Поточний пароль обов'язковий" })
  current_password: string;

  // 🔐 Валідація нового паролю наслідується від NewPasswordValidationMixin
  // Правила: мін 8, макс 50 символів, велика+мала літера, цифра, спецсимвол
}
