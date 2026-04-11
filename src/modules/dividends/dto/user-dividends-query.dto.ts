import {
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  Min,
} from 'class-validator';
import { DividendStatus } from '../../../../generated/prisma';

export class UserDividendsQueryDto {
  @IsOptional()
  @IsEnum(DividendStatus)
  status?: DividendStatus;

  @IsOptional()
  @IsInt()
  @Min(1)
  investmentId?: number;

  @IsOptional()
  @IsDateString()
  dateFrom?: string;

  @IsOptional()
  @IsDateString()
  dateTo?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number = 20;

  @IsOptional()
  @IsIn(['createdAt', 'amount'])
  sortBy?: 'createdAt' | 'amount' = 'createdAt';

  @IsOptional()
  @IsIn(['asc', 'desc'])
  sortOrder?: 'asc' | 'desc' = 'desc';
}
