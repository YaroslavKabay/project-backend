import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateDividendDto } from './dto/create-dividend.dto';
import { DividendStatus, TransactionType } from '../../../generated/prisma';
import { DIVIDEND_STATUS } from '@projectua/project-core';

@Injectable()
export class DividendsService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: всі дивіденди з опційним фільтром по userId або investmentId
  async findAll(userId?: number, investmentId?: number) {
    return this.prisma.dividend.findMany({
      where: {
        ...(userId && { userId }),
        ...(investmentId && { investmentId }),
      },
      include: {
        user: {
          select: { id: true, name: true, surname: true, email: true },
        },
        investment: {
          select: { id: true, startCapital: true, currentCapital: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // User: власні дивіденди
  async findAllForUser(userId: number) {
    return this.prisma.dividend.findMany({
      where: { userId },
      include: {
        investment: {
          select: { id: true, startCapital: true, currentCapital: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number) {
    const dividend = await this.prisma.dividend.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, surname: true, email: true },
        },
        investment: {
          select: { id: true, startCapital: true, currentCapital: true },
        },
      },
    });

    if (!dividend) {
      throw new NotFoundException(`Дивіденд #${id} не знайдено`);
    }

    return dividend;
  }

  async create(dto: CreateDividendDto) {
    const [investment, user] = await Promise.all([
      this.prisma.investment.findUnique({ where: { id: dto.investmentId } }),
      this.prisma.user.findUnique({ where: { id: dto.userId } }),
    ]);

    if (!investment) {
      throw new NotFoundException(
        `Інвестицію #${dto.investmentId} не знайдено`,
      );
    }

    if (!user) {
      throw new NotFoundException(`Користувача #${dto.userId} не знайдено`);
    }

    return this.prisma.dividend.create({
      data: {
        investmentId: dto.investmentId,
        userId: dto.userId,
        amount: dto.amount,
        status: dto.status ?? DividendStatus.PENDING,
      },
    });
  }

  // Змінити статус дивіденду; при PAID — зараховує суму на баланс юзера і створює транзакцію
  async updateStatus(id: number, status: DividendStatus) {
    const dividend = await this.prisma.dividend.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!dividend) {
      throw new NotFoundException(`Дивіденд #${id} не знайдено`);
    }

    if (dividend.status === DIVIDEND_STATUS.PAID) {
      throw new BadRequestException('Цей дивіденд вже виплачено');
    }

    if (dividend.status === DIVIDEND_STATUS.CANCELLED) {
      throw new BadRequestException('Скасований дивіденд не можна виплатити');
    }

    if (status === DIVIDEND_STATUS.PAID) {
      const balanceBefore = dividend.user.balance;
      const balanceAfter = balanceBefore + dividend.amount;

      // Отримуємо userProjectId через investment щоб оновити UserProject.dividends
      const investment = await this.prisma.investment.findUnique({
        where: { id: dividend.investmentId },
        select: { userProjectId: true },
      });

      // Атомарно: виплата дивіденду + баланс юзера + транзакція + UserProject.dividends
      await this.prisma.$transaction(async (tx) => {
        await tx.dividend.update({
          where: { id },
          data: { status: DIVIDEND_STATUS.PAID as DividendStatus },
        });

        await tx.user.update({
          where: { id: dividend.userId },
          data: { balance: balanceAfter },
        });

        await tx.transaction.create({
          data: {
            userId: dividend.userId,
            type: TransactionType.DIVIDEND_PAYMENT,
            amount: dividend.amount,
            balanceBefore,
            balanceAfter,
            investmentId: dividend.investmentId,
            relatedEntityType: 'Dividend',
            relatedEntityId: dividend.id,
          },
        });

        // Накопичуємо суму виплачених дивідендів у UserProject
        if (investment) {
          await tx.userProject.update({
            where: { id: investment.userProjectId },
            data: { dividends: { increment: dividend.amount } },
          });
        }
      });

      return this.prisma.dividend.findUnique({ where: { id } });
    }

    return this.prisma.dividend.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: number) {
    const dividend = await this.prisma.dividend.findUnique({ where: { id } });

    if (!dividend) {
      throw new NotFoundException(`Дивіденд #${id} не знайдено`);
    }

    if (dividend.status === DIVIDEND_STATUS.PAID) {
      throw new BadRequestException(
        'Не можна видалити виплачений дивіденд. Спочатку скасуйте виплату',
      );
    }

    await this.prisma.dividend.delete({ where: { id } });

    return { message: `Дивіденд #${id} видалено` };
  }
}
