import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { UserProjectsService } from './user-projects.service';
import { CreateUserProjectDto } from './dto/create-user-project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole } from '../../../generated/prisma';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@Controller('user-projects')
@UseGuards(JwtAuthGuard)
export class UserProjectsController {
  constructor(private readonly userProjectsService: UserProjectsService) {}

  // Деталі одного UserProject поточного юзера
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.userProjectsService.findOneByUser(id, user.id);
  }

  // Тільки Admin — приєднати юзера до проекту
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateUserProjectDto) {
    return this.userProjectsService.create(dto);
  }

  // Тільки Admin — видалити юзера з проекту
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProjectsService.remove(id);
  }
}
