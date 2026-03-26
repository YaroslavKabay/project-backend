import {
  IsString,
  IsOptional,
  IsArray,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateMarketingCardDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string;

  @IsOptional()
  @IsArray()
  @IsUrl({}, { each: true, message: 'Кожен елемент повинен бути валідним URL' })
  imageUrls?: string[];
}
