import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma, UserRole, InvestmentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateInvestmentDto } from './dto/create-investment.dto';
import { UpdateInvestmentDto } from './dto/update-investment.dto';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import {
  calcProfitPercentage,
  calcCapitalization,
  calcTotalCapitalization,
  calcAverageProfitPercentage,
} from '@projectua/project-core';
import { BackofficeInvestmentsQueryDto } from '../backoffice/dto/backoffice-investments-query.dto';

@Injectable()
export class InvestmentsService {
  constructor(private readonly prisma: PrismaService) {}

  private calculateFields(startCapital: number, currentCapital: number) {
    return {
      profitPercentage: calcProfitPercentage(startCapital, currentCapital),
      capitalization: calcCapitalization(startCapital, currentCapital),
    };
  }

  // Admin: всі інвестиції з фільтрами
  async findAll(
    filters: BackofficeInvestmentsQueryDto = new BackofficeInvestmentsQueryDto(),
  ) {
    const {
      userId,
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.InvestmentWhereInput = {};

    if (userId) where.userProject = { userId };
    if (status) where.status = status as InvestmentStatus;

    if (dateFrom ?? dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.investment.findMany({
        where,
        include: {
          userProject: {
            select: {
              id: true,
              userId: true,
              projectId: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.investment.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // User: тільки власні інвестиції
  async findAllForUser(userId: number) {
    return this.prisma.investment.findMany({
      where: {
        userProject: { userId },
      },
      include: {
        userProject: {
          select: {
            id: true,
            projectId: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: number, currentUser: AuthenticatedUser) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
      include: {
        userProject: {
          select: {
            id: true,
            userId: true,
            projectId: true,
          },
        },
      },
    });

    if (!investment) {
      throw new NotFoundException(`Інвестицію #${id} не знайдено`);
    }

    // Звичайний юзер може бачити тільки власні інвестиції
    if (
      currentUser.role === UserRole.USER &&
      investment.userProject.userId !== currentUser.id
    ) {
      throw new ForbiddenException('Доступ заборонено');
    }

    return investment;
  }

  async create(dto: CreateInvestmentDto) {
    const userProject = await this.prisma.userProject.findUnique({
      where: { id: dto.userProjectId },
    });

    if (!userProject) {
      throw new NotFoundException(
        `UserProject #${dto.userProjectId} не знайдено`,
      );
    }

    const { profitPercentage, capitalization } = this.calculateFields(
      dto.startCapital,
      dto.currentCapital,
    );

    const investment = await this.prisma.investment.create({
      data: {
        userProjectId: dto.userProjectId,
        startCapital: dto.startCapital,
        currentCapital: dto.currentCapital,
        hasIncome: dto.hasIncome ?? false,
        profitPercentage,
        capitalization,
      },
    });

    // Оновлюємо агреговані поля в UserProject
    await this.recalculateUserProject(dto.userProjectId);

    return investment;
  }

  async update(id: number, dto: UpdateInvestmentDto) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Інвестицію #${id} не знайдено`);
    }

    const newStartCapital = dto.startCapital ?? investment.startCapital;
    const newCurrentCapital = dto.currentCapital ?? investment.currentCapital;
    const { profitPercentage, capitalization } = this.calculateFields(
      newStartCapital,
      newCurrentCapital,
    );

    const updated = await this.prisma.investment.update({
      where: { id },
      data: {
        ...(dto.startCapital !== undefined && {
          startCapital: dto.startCapital,
        }),
        ...(dto.currentCapital !== undefined && {
          currentCapital: dto.currentCapital,
        }),
        ...(dto.hasIncome !== undefined && { hasIncome: dto.hasIncome }),
        profitPercentage,
        capitalization,
      },
    });

    await this.recalculateUserProject(investment.userProjectId);

    return updated;
  }

  async updateStatus(id: number, status: InvestmentStatus) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Інвестицію #${id} не знайдено`);
    }

    return this.prisma.investment.update({
      where: { id },
      data: { status },
    });
  }

  async remove(id: number) {
    const investment = await this.prisma.investment.findUnique({
      where: { id },
    });

    if (!investment) {
      throw new NotFoundException(`Інвестицію #${id} не знайдено`);
    }

    await this.prisma.investment.delete({ where: { id } });

    await this.recalculateUserProject(investment.userProjectId);

    return { message: `Інвестицію #${id} видалено` };
  }

  // Перераховує totalInvested, profitPercentage, capitalization у UserProject
  // на основі всіх активних інвестицій
  private async recalculateUserProject(userProjectId: number) {
    const investments = await this.prisma.investment.findMany({
      where: {
        userProjectId,
        status: InvestmentStatus.ACTIVE,
      },
    });

    const totalInvested = investments.reduce(
      (sum, inv) => sum + inv.startCapital,
      0,
    );
    const capitalization = calcTotalCapitalization(investments);
    const profitPercentage =
      investments.length > 0 ? calcAverageProfitPercentage(investments) : 0;

    await this.prisma.userProject.update({
      where: { id: userProjectId },
      data: { totalInvested, capitalization, profitPercentage },
    });
  }
}
