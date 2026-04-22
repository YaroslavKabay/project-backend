import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TransactionsService } from './transactions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { UserTransactionsQueryDto } from './dto/user-transactions-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactionsService: TransactionsService) {}

  @Get()
  findMyTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UserTransactionsQueryDto,
  ) {
    return this.transactionsService.findAllForUser(user.id, query);
  }
}
