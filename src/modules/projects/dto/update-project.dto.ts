import {
  IsString,
  IsOptional,
  IsNumber,
  IsPositive,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsNumber()
  @IsPositive()
  targetAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  profitPercentage?: number;

  @IsOptional()
  @IsString()
  status?: string;
}
