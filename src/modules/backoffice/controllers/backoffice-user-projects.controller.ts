import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserProjectsService } from '../../user-projects/user-projects.service';
import { CreateUserProjectDto } from '../../user-projects/dto/create-user-project.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../admin-auth/guards/admin-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BackofficeUserProjectsQueryDto } from '../dto/backoffice-user-projects-query.dto';

@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('backoffice/user-projects')
export class BackofficeUserProjectsController {
  constructor(private readonly userProjectsService: UserProjectsService) {}

  @Get()
  findAll(@Query() filters: BackofficeUserProjectsQueryDto) {
    return this.userProjectsService.findAll(filters);
  }

  @Post()
  create(@Body() dto: CreateUserProjectDto) {
    return this.userProjectsService.create(dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProjectsService.remove(id);
  }
}
