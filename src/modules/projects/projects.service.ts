import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { BackofficeProjectsQueryDto } from '../backoffice/dto/backoffice-projects-query.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Всі проекти з маркетинговою карткою
  async findAll(
    filters: BackofficeProjectsQueryDto = new BackofficeProjectsQueryDto(),
  ) {
    const {
      status,
      dateFrom,
      dateTo,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 20,
    } = filters;

    const skip = (page - 1) * limit;
    const where: Prisma.ProjectWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (dateFrom ?? dateTo) {
      where.createdAt = {
        gte: dateFrom ? new Date(dateFrom) : undefined,
        lte: dateTo ? new Date(dateTo) : undefined,
      };
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: { marketingCard: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  // Один проект по id
  async findOne(id: number) {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { marketingCard: true },
    });

    if (!project) {
      throw new NotFoundException(`Проект з id ${id} не знайдено`);
    }

    return project;
  }

  // Створити проект (тільки Admin)
  async create(dto: CreateProjectDto) {
    return this.prisma.project.create({
      data: dto,
      include: { marketingCard: true },
    });
  }

  // Оновити проект (тільки Admin)
  async update(id: number, dto: UpdateProjectDto) {
    await this.findOne(id); // Перевіряємо що проект існує

    return this.prisma.project.update({
      where: { id },
      data: dto,
      include: { marketingCard: true },
    });
  }

  // Видалити проект (тільки Admin)
  async remove(id: number) {
    await this.findOne(id); // Перевіряємо що проект існує

    return this.prisma.project.delete({
      where: { id },
    });
  }
}
