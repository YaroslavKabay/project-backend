import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { DividendStatus } from '../../../../generated/prisma';

export class CreateDividendDto {
  @IsNotEmpty({ message: 'ID інвестиції не може бути пустим' })
  @IsNumber({}, { message: 'ID інвестиції повинен бути числом' })
  @IsPositive()
  investmentId: number;

  @IsNotEmpty({ message: 'ID користувача не може бути пустим' })
  @IsNumber({}, { message: 'ID користувача повинен бути числом' })
  @IsPositive()
  userId: number;

  @IsNotEmpty({ message: 'Сума дивіденду не може бути пустою' })
  @IsNumber({}, { message: 'Сума повинна бути числом' })
  @IsPositive({ message: 'Сума повинна бути більше 0' })
  amount: number;

  @IsOptional()
  @IsEnum(DividendStatus, { message: 'Невалідний статус дивіденду' })
  status?: DividendStatus;
}
