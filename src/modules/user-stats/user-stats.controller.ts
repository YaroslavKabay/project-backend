import { Controller, Get, UseGuards } from '@nestjs/common';
import { UserStatsService } from './user-stats.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('user-stats')
export class UserStatsController {
  constructor(private readonly userStatsService: UserStatsService) {}

  // Агреговані дані для дашборду поточного юзера:
  // totalInvested, capitalization, totalDividends
  @Get()
  getUserStats(@CurrentUser() user: AuthenticatedUser) {
    return this.userStatsService.getUserDashboard(user.id);
  }
}
