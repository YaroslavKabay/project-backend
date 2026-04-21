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
import { TransactionsService } from '../../transactions/transactions.service';
import { CreateTransactionDto } from '../../transactions/dto/create-transaction.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../admin-auth/guards/admin-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BackofficeQueryDto } from '../dto/backoffice-query.dto';

@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('backoffice/transactions')
export class BackofficeTransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll(@Query() filters: BackofficeQueryDto) {
    return this.transactionsService.findAll(filters);
  }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.remove(id);
  }
}
