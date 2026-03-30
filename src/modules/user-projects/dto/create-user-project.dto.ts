import { IsNotEmpty, IsNumber, IsPositive } from 'class-validator';

export class CreateUserProjectDto {
  @IsNotEmpty({ message: 'ID користувача не може бути пустим' })
  @IsNumber({}, { message: 'ID користувача повинен бути числом' })
  @IsPositive({ message: 'ID користувача повинен бути більше 0' })
  userId: number;

  @IsNotEmpty({ message: 'ID проекту не може бути пустим' })
  @IsNumber({}, { message: 'ID проекту повинен бути числом' })
  @IsPositive({ message: 'ID проекту повинен бути більше 0' })
  projectId: number;
}
