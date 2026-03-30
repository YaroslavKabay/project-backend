import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvestmentStatus, DividendStatus } from '../../../generated/prisma';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Агреговані дані для дашборду юзера (3 карточки)
  async getUserDashboard(userId: number) {
    const [userProjects, dividends] = await Promise.all([
      // Всі UserProject юзера з активними інвестиціями
      this.prisma.userProject.findMany({
        where: { userId },
        include: {
          investments: {
            where: { status: InvestmentStatus.ACTIVE },
          },
        },
      }),
      // Виплачені дивіденди юзера
      this.prisma.dividend.findMany({
        where: { userId, status: DividendStatus.PAID },
      }),
    ]);

    // Сума всіх початкових капіталів по активних інвестиціях
    const totalInvested = userProjects.reduce((sum, up) => {
      return (
        sum +
        up.investments.reduce((invSum, inv) => invSum + inv.startCapital, 0)
      );
    }, 0);

    // Поточна капіталізація = поточний капітал - початковий
    const totalCurrentCapital = userProjects.reduce((sum, up) => {
      return (
        sum +
        up.investments.reduce((invSum, inv) => invSum + inv.currentCapital, 0)
      );
    }, 0);

    const capitalization = totalCurrentCapital - totalInvested;

    // Загальна сума виплачених дивідендів
    const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

    return {
      totalInvested,
      capitalization,
      totalDividends,
    };
  }
}
