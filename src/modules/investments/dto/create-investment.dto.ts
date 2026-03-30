import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsBoolean,
  IsOptional,
} from 'class-validator';

export class CreateInvestmentDto {
  @IsNotEmpty({ message: 'ID UserProject не може бути пустим' })
  @IsNumber({}, { message: 'ID UserProject повинен бути числом' })
  @IsPositive()
  userProjectId: number;

  @IsNotEmpty({ message: 'Початковий капітал не може бути пустим' })
  @IsNumber({}, { message: 'Початковий капітал повинен бути числом' })
  @IsPositive({ message: 'Початковий капітал повинен бути більше 0' })
  startCapital: number;

  @IsNotEmpty({ message: 'Поточний капітал не може бути пустим' })
  @IsNumber({}, { message: 'Поточний капітал повинен бути числом' })
  @IsPositive({ message: 'Поточний капітал повинен бути більше 0' })
  currentCapital: number;

  @IsOptional()
  @IsBoolean()
  hasIncome?: boolean;
}
