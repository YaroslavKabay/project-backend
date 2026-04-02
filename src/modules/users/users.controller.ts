import { Controller, Put, Get, Body, UseGuards, Query } from '@nestjs/common';
import { UsersService } from './users.service';
import { TransactionsService } from '../transactions/transactions.service';
import { DividendsService } from '../dividends/dividends.service';
import { InvestmentsService } from '../investments/investments.service';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly transactionsService: TransactionsService,
    private readonly dividendsService: DividendsService,
    private readonly investmentsService: InvestmentsService,
    private readonly userProjectsService: UserProjectsService,
  ) {}

  @Get('me/transactions')
  getMyTransactions(
    @CurrentUser() user: AuthenticatedUser,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.transactionsService.findAllForUser(
      user.id,
      page ? parseInt(page, 10) : 1,
      limit ? parseInt(limit, 10) : 20,
    );
  }

  @Get('me/dividends')
  getMyDividends(@CurrentUser() user: AuthenticatedUser) {
    return this.dividendsService.findAllForUser(user.id);
  }

  @Get('me/investments')
  getMyInvestments(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentsService.findAllForUser(user.id);
  }

  @Get('me/projects')
  getMyProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.userProjectsService.findAllByUser(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
