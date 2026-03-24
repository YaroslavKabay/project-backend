import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsNumber,
  IsPositive,
  MinLength,
  MaxLength,
  Min,
  Max,
} from 'class-validator';

export class CreateProjectDto {
  @IsNotEmpty({ message: 'Назва проекту не може бути пустою' })
  @IsString({ message: 'Назва повинна бути текстом' })
  @MinLength(3, { message: 'Назва повинна містити мінімум 3 символи' })
  @MaxLength(100, { message: 'Назва не може бути довшою 100 символів' })
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000, { message: 'Опис не може бути довшим 1000 символів' })
  description?: string;

  @IsNotEmpty({ message: 'Цільова сума не може бути пустою' })
  @IsNumber({}, { message: 'Цільова сума повинна бути числом' })
  @IsPositive({ message: 'Цільова сума повинна бути більше 0' })
  targetAmount: number;

  @IsNotEmpty({ message: 'Відсоток прибутку не може бути пустим' })
  @IsNumber({}, { message: 'Відсоток прибутку повинен бути числом' })
  @Min(0, { message: 'Відсоток прибутку не може бути від`ємним' })
  @Max(100, { message: 'Відсоток прибутку не може перевищувати 100' })
  profitPercentage: number;
}
