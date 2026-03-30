import { IsNumber, IsPositive, IsBoolean, IsOptional } from 'class-validator';

export class UpdateInvestmentDto {
  @IsOptional()
  @IsNumber({}, { message: 'Початковий капітал повинен бути числом' })
  @IsPositive({ message: 'Початковий капітал повинен бути більше 0' })
  startCapital?: number;

  @IsOptional()
  @IsNumber({}, { message: 'Поточний капітал повинен бути числом' })
  @IsPositive({ message: 'Поточний капітал повинен бути більше 0' })
  currentCapital?: number;

  @IsOptional()
  @IsBoolean()
  hasIncome?: boolean;
}
