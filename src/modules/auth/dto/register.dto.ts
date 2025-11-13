import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { PasswordValidationMixin } from './password-validation.dto';

export class RegisterDto extends PasswordValidationMixin {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsNotEmpty({ message: 'Email не може бути пустим' })
  @IsEmail({}, { message: 'Будь ласка, введіть валідний email' })
  email: string;

  // 🔐 Валідація паролю наслідується від PasswordValidationMixin
  // Правила: мін 8, макс 50 символів, велика+мала літера, цифра, спецсимвол

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: "Ім'я не може бути пустим" })
  @IsString({ message: "Ім'я повинно бути текстом" })
  @MinLength(2, { message: "Ім'я повинно містити мінімум 2 символи" })
  @MaxLength(30, { message: "Ім'я не може бути довшим 30 символів" })
  @Matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/, {
    message: "Ім'я може містити тільки літери та пробіли",
  })
  name: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsNotEmpty({ message: 'Прізвище не може бути пустим' })
  @IsString({ message: 'Прізвище повинно бути текстом' })
  @MinLength(2, { message: 'Прізвище повинно містити мінімум 2 символи' })
  @MaxLength(30, { message: 'Прізвище не може бути довшим 30 символів' })
  @Matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/, {
    message: 'Прізвище може містити тільки літери та пробіли',
  })
  surname: string;
}
