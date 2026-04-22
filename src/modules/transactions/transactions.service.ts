import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

import {
  DEBIT_TRANSACTION_TYPES,
  CREDIT_TRANSACTION_TYPES,
  hasSufficientBalance,
  type TransactionType as CoreTransactionType,
} from '@projectua/project-core';
import { UserTransactionsQueryDto } from './dto/user-transactions-query.dto';
import { BackofficeTransactionsQueryDto } from '../backoffice/dto/backoffice-transactions-query.dto';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: всі транзакції з фільтрами
  async findAll(
    filters: BackofficeTransactionsQueryDto = new BackofficeTransactionsQueryDto(),
  ) {
    const {
      userId,
      type,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.TransactionWhereInput = {};

    if (userId) where.userId = userId;
    if (type) where.type = type;

    if (dateFrom ?? dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, surname: true, email: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // User: власні транзакції з фільтрами та пагінацією
  async findAllForUser(
    currentUserId: number,
    filters: UserTransactionsQueryDto = new UserTransactionsQueryDto(),
  ) {
    const {
      type,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = filters;

    const skip = (page - 1) * limit;

    const where: Prisma.TransactionWhereInput = { userId: currentUserId };

    if (type) {
      where.type = type;
    }

    if (dateFrom ?? dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }

    const [transactions, total] = await Promise.all([
      this.prisma.transaction.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.transaction.count({ where }),
    ]);

    return {
      data: transactions,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
      include: {
        user: {
          select: { id: true, name: true, surname: true, email: true },
        },
      },
    });

    if (!transaction) {
      throw new NotFoundException(`Транзакцію #${id} не знайдено`);
    }

    return transaction;
  }

  async create(dto: CreateTransactionDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });

    if (!user) {
      throw new NotFoundException(`Користувача #${dto.userId} не знайдено`);
    }

    const coreType = dto.type as unknown as CoreTransactionType;

    if (!hasSufficientBalance(user.balance, dto.amount, coreType)) {
      throw new BadRequestException(
        'Недостатньо коштів на балансі для цієї операції',
      );
    }

    const balanceBefore = user.balance;
    let balanceAfter = user.balance;

    if (CREDIT_TRANSACTION_TYPES.includes(coreType)) {
      balanceAfter = user.balance + dto.amount;
    } else if (DEBIT_TRANSACTION_TYPES.includes(coreType)) {
      balanceAfter = user.balance - dto.amount;
    }
    // DIVIDEND_PAYMENT — баланс оновлюється через DividendsService

    const [transaction] = await this.prisma.$transaction([
      this.prisma.transaction.create({
        data: {
          userId: dto.userId,
          type: dto.type,
          amount: dto.amount,
          paymentMethod: dto.paymentMethod,
          balanceBefore,
          balanceAfter,
          investmentId: dto.investmentId,
          relatedEntityType: dto.relatedEntityType,
          relatedEntityId: dto.relatedEntityId,
        },
      }),
      this.prisma.user.update({
        where: { id: dto.userId },
        data: { balance: balanceAfter },
      }),
    ]);

    return transaction;
  }

  async remove(id: number) {
    const transaction = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new NotFoundException(`Транзакцію #${id} не знайдено`);
    }

    await this.prisma.transaction.delete({ where: { id } });

    return { message: `Транзакцію #${id} видалено` };
  }
}
