import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from './investments.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UserRole, InvestmentStatus } from '../../../generated/prisma';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('investments')
export class InvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  // Admin: всі інвестиції (з опційним фільтром по userProjectId)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('admin')
  findAll(@Query('userProjectId') userProjectId?: string) {
    const id = userProjectId ? parseInt(userProjectId, 10) : undefined;
    return this.investmentsService.findAll(id);
  }

  // Admin або власник
  @Get(':id')
  findOne(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.investmentsService.findOne(id, user);
  }

  // Admin: створення інвестиції
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateInvestmentDto) {
    return this.investmentsService.create(dto);
  }

  // Admin: оновлення капіталів (profitPercentage розраховується автоматично)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(id, dto);
  }

  // Admin: зміна статусу (ACTIVE / SOLD / PAUSED)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: InvestmentStatus,
  ) {
    return this.investmentsService.updateStatus(id, status);
  }

  // Admin: видалення
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.remove(id);
  }
}
