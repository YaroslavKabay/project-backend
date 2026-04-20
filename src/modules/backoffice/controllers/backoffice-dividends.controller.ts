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
import { DividendsService } from '../../dividends/dividends.service';
import { CreateDividendDto } from '../../dividends/dto/create-dividend.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { DividendStatus } from '@prisma/client';

@UseGuards(AdminJwtAuthGuard)
@Controller('backoffice/dividends')
export class BackofficeDividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  @Get()
  findAll() {
    return this.dividendsService.findAll();
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

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dividendsService.remove(id);
  }
}
