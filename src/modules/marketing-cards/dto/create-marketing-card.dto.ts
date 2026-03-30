import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  IsArray,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateMarketingCardDto {
  @IsNotEmpty({ message: 'ID проекту не може бути пустим' })
  @IsNumber({}, { message: 'ID проекту повинен бути числом' })
  @IsPositive({ message: 'ID проекту повинен бути більше 0' })
  projectId: number;

  @IsNotEmpty({ message: 'Назва не може бути пустою' })
  @IsString({ message: 'Назва повинна бути текстом' })
  @MinLength(3, { message: 'Назва повинна містити мінімум 3 символи' })
  @MaxLength(100, { message: 'Назва не може бути довшою 100 символів' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(2000, { message: 'Контент не може бути довшим 2000 символів' })
  content?: string;

  @IsOptional()
  @IsArray({ message: 'imageUrls повинен бути масивом' })
  @IsUrl({}, { each: true, message: 'Кожен елемент повинен бути валідним URL' })
  imageUrls?: string[];
}
