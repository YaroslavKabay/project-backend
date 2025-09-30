import { IsEmail, IsString, MinLength, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @Transform(({ value }) => value?.toLowerCase().trim())
  @IsNotEmpty({ message: 'Email не може бути пустим' })
  @IsEmail({}, { message: 'Будь ласка, введіть валідний email' })
  email: string;

  @IsString({ message: 'Пароль повинен бути текстом' })
  @IsNotEmpty({ message: 'Пароль не може бути пустим' })
  password: string;
}
