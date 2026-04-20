import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UserProjectsService } from '../../user-projects/user-projects.service';
import { CreateUserProjectDto } from '../../user-projects/dto/create-user-project.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('backoffice/user-projects')
export class BackofficeUserProjectsController {
  constructor(private readonly userProjectsService: UserProjectsService) {}

  @Get()
  findAll() {
    return this.userProjectsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateUserProjectDto) {
    return this.userProjectsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userProjectsService.remove(id);
  }
}
