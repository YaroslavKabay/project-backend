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
  UseGuards,
} from '@nestjs/common';
import { InvestmentsService } from '../../investments/investments.service';
import { CreateInvestmentDto } from '../../investments/dto/create-investment.dto';
import { UpdateInvestmentDto } from '../../investments/dto/update-investment.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { InvestmentStatus } from '@prisma/client';

@UseGuards(AdminJwtAuthGuard)
@Controller('backoffice/investments')
export class BackofficeInvestmentsController {
  constructor(private readonly investmentsService: InvestmentsService) {}

  @Get()
  findAll() {
    return this.investmentsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateInvestmentDto) {
    return this.investmentsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateInvestmentDto) {
    return this.investmentsService.update(id, dto);
  }

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
