import { IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { TransactionType } from '@prisma/client';
import { BackofficeBaseQueryDto } from './backoffice-base-query.dto';

export class BackofficeTransactionsQueryDto extends BackofficeBaseQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsEnum(TransactionType)
  type?: TransactionType;
}
