import {
  IsString,
  IsOptional,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateUserDto {
  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: "Ім'я повинно бути текстом" })
  @MinLength(2, { message: "Ім'я повинно містити мінімум 2 символи" })
  @MaxLength(30, { message: "Ім'я не може бути довшим 30 символів" })
  @Matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/, {
    message: "Ім'я може містити тільки літери та пробіли",
  })
  name?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString({ message: 'Прізвище повинно бути текстом' })
  @MinLength(2, { message: 'Прізвище повинно містити мінімум 2 символи' })
  @MaxLength(30, { message: 'Прізвище не може бути довшим 30 символів' })
  @Matches(/^[a-zA-Zа-яА-ЯіІїЇєЄ\s]+$/, {
    message: 'Прізвище може містити тільки літери та пробіли',
  })
  surname?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsEmail({}, { message: 'Будь ласка, введіть валідний email' })
  email?: string;
}
