import { IsEmail, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class ForgotPasswordDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.toLowerCase().trim() : value,
  )
  @IsNotEmpty({ message: 'Email не може бути пустим' })
  @IsEmail({}, { message: 'Введіть валідний email' })
  email: string;
}
