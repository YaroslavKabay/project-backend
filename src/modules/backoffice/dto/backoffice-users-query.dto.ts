import { IsOptional, IsString } from 'class-validator';
import { BackofficeBaseQueryDto } from './backoffice-base-query.dto';

export class BackofficeUsersQueryDto extends BackofficeBaseQueryDto {
  @IsOptional()
  @IsString()
  search?: string;
}
