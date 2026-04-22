import { IsOptional, IsInt, IsEnum, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { DividendStatus } from '@prisma/client';
import { BackofficeBaseQueryDto } from './backoffice-base-query.dto';

export class BackofficeDividendsQueryDto extends BackofficeBaseQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  investmentId?: number;

  @IsOptional()
  @IsEnum(DividendStatus)
  status?: DividendStatus;
}
