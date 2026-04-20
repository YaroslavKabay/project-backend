import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from '../../users/users.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('backoffice/users')
export class BackofficeUsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.usersService.findOne(id);
  }
}
