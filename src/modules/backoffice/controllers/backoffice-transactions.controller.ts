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
import { TransactionsService } from '../../transactions/transactions.service';
import { CreateTransactionDto } from '../../transactions/dto/create-transaction.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('backoffice/transactions')
export class BackofficeTransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findAll() {
    return this.transactionsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateTransactionDto) {
    return this.transactionsService.create(dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.transactionsService.remove(id);
  }
}
