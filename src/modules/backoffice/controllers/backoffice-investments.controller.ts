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
import { InvestmentsService } from '../../investments/investments.service';
import { CreateInvestmentDto } from '../../investments/dto/create-investment.dto';
import { UpdateInvestmentDto } from '../../investments/dto/update-investment.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../admin-auth/guards/admin-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { InvestmentStatus } from '@prisma/client';
import { BackofficeInvestmentsQueryDto } from '../dto/backoffice-investments-query.dto';

@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('backoffice/investments')
export class BackofficeInvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  findAll(@Query() filters: BackofficeInvestmentsQueryDto) {
    return this.investmentsService.findAll(filters);
  }

  @Post()
  create(@Body() dto: CreateInvestmentDto) {
    return this.investmentsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateInvestmentDto,
  ) {
    return this.investmentsService.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.investmentsService.remove(id);
  }

  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: InvestmentStatus,
  ) {
    return this.investmentsService.updateStatus(id, status);
  }
}
