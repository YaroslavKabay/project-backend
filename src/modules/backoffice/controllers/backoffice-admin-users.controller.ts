import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AdminAuthService } from '../../admin-auth/admin-auth.service';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../admin-auth/guards/admin-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentAdmin } from '../../../common/decorators/current-admin.decorator';
import type { AuthenticatedAdmin } from '@projectua/project-core';
import { CreateAdminUserDto } from '../dto/create-admin-user.dto';
import { UpdateAdminUserDto } from '../dto/update-admin-user.dto';
import { ResetAdminPasswordDto } from '../dto/reset-admin-password.dto';

@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Roles('ADMIN')
@Controller('backoffice/admin-users')
export class BackofficeAdminUsersController {
  constructor(private readonly adminAuthService: AdminAuthService) {}

  @Get()
  findAll() {
    return this.adminAuthService.findAllAdmins();
  }

  @Post()
  create(@Body() dto: CreateAdminUserDto) {
    return this.adminAuthService.createAdmin(dto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAdminUserDto,
  ) {
    return this.adminAuthService.updateAdmin(id, dto);
  }

  @Delete(':id')
  delete(
    @Param('id', ParseIntPipe) id: number,
    @CurrentAdmin() admin: AuthenticatedAdmin,
  ) {
    return this.adminAuthService.deleteAdmin(id, admin.id);
  }

  @Post(':id/reset-password')
  resetPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResetAdminPasswordDto,
  ) {
    return this.adminAuthService.resetAdminPassword(id, dto.newPassword);
  }
}
