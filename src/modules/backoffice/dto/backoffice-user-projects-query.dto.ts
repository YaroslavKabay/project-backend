import { IsOptional, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { BackofficeBaseQueryDto } from './backoffice-base-query.dto';

export class BackofficeUserProjectsQueryDto extends BackofficeBaseQueryDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  userId?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  projectId?: number;
}
