import { IsString, IsNotEmpty } from 'class-validator';

/**
 * 🔄 DTO ДЛЯ ОНОВЛЕННЯ ACCESS ТОКЕНУ
 * Використовується в POST /auth/refresh
 */
export class RefreshDto {
  @IsString({ message: 'Refresh токен повинен бути текстом' })
  @IsNotEmpty({ message: 'Refresh токен не може бути пустим' })
  refresh_token: string;
}
