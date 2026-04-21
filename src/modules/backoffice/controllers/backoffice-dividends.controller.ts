import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DividendsService } from '../../dividends/dividends.service';
import { CreateDividendDto } from '../../dividends/dto/create-dividend.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../admin-auth/guards/admin-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { DividendStatus } from '@prisma/client';
import { BackofficeQueryDto } from '../dto/backoffice-query.dto';

@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('backoffice/dividends')
export class BackofficeDividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  @Get()
  findAll(@Query() filters: BackofficeQueryDto) {
    return this.dividendsService.findAll(filters);
  }

  @Post()
  create(@Body() dto: CreateDividendDto) {
    return this.dividendsService.create(dto);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DividendStatus,
  ) {
    return this.dividendsService.updateStatus(id, status);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dividendsService.remove(id);
  }
}
