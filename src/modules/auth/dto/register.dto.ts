import {
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsStrongPassword,
  IsNotEmpty,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsNotEmpty({ message: 'Email не може бути пустим' })
  @IsEmail({}, { message: 'Будь ласка, введіть валідний email' })
  email: string;

  @IsString({ message: 'Пароль повинен бути текстом' })
  @IsNotEmpty({ message: 'Пароль не може бути пустим' })
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
        'Пароль повинен містити мінімум 8 символів, велику та малу літери і цифру',
    },
  )
  @MaxLength(50, { message: 'Пароль не може бути довшим 50 символів' })
  password: string;

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
