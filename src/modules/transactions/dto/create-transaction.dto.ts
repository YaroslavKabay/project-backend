import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsEnum,
  IsOptional,
  IsString,
} from 'class-validator';
import { TransactionType } from '../../../../generated/prisma';

export class CreateTransactionDto {
  @IsNotEmpty({ message: 'ID користувача не може бути пустим' })
  @IsNumber({}, { message: 'ID користувача повинен бути числом' })
  @IsPositive()
  userId: number;

  @IsNotEmpty({ message: 'Тип транзакції не може бути пустим' })
  @IsEnum(TransactionType, { message: 'Невалідний тип транзакції' })
  type: TransactionType;

  @IsNotEmpty({ message: 'Сума не може бути пустою' })
  @IsNumber({}, { message: 'Сума повинна бути числом' })
  @IsPositive({ message: 'Сума повинна бути більше 0' })
  amount: number;

  @IsOptional()
  @IsString()
  paymentMethod?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  investmentId?: number;

  @IsOptional()
  @IsString()
  relatedEntityType?: string;

  @IsOptional()
  @IsNumber()
  relatedEntityId?: number;
}
