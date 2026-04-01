import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InvestmentStatus, DividendStatus } from '../../../generated/prisma';
import {
  INVESTMENT_STATUS,
  DIVIDEND_STATUS,
  calcTotalCapitalization,
} from '@projectua/project-core';

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
            where: { status: INVESTMENT_STATUS.ACTIVE as InvestmentStatus },
          },
        },
      }),
      // Виплачені дивіденди юзера
      this.prisma.dividend.findMany({
        where: { userId, status: DIVIDEND_STATUS.PAID as DividendStatus },
      }),
    ]);

    const allInvestments = userProjects.flatMap((up) => up.investments);

    const totalInvested = allInvestments.reduce(
      (sum, inv) => sum + inv.startCapital,
      0,
    );

    const capitalization = calcTotalCapitalization(allInvestments);

    // Загальна сума виплачених дивідендів
    const totalDividends = dividends.reduce((sum, d) => sum + d.amount, 0);

    return {
      totalInvested,
      capitalization,
      totalDividends,
    };
  }
}
