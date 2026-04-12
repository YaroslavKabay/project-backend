import { Controller, Get, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@UseGuards(JwtAuthGuard)
@Controller('user-stats')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  // Агреговані дані для дашборду поточного юзера:
  // totalInvested, capitalization, totalDividends
  @Get()
  getUserStats(@CurrentUser() user: AuthenticatedUser) {
    return this.dashboardService.getUserDashboard(user.id);
  }
}
