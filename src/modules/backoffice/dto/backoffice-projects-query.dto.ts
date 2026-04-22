import { IsOptional, IsString } from 'class-validator';
import { BackofficeBaseQueryDto } from './backoffice-base-query.dto';

export class BackofficeProjectsQueryDto extends BackofficeBaseQueryDto {
  @IsOptional()
  @IsString()
  status?: string;
}
