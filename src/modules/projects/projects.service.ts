import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';

@Injectable()
export class ProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Всі проекти з маркетинговою карткою
  async findAll() {
    return this.prisma.project.findMany({
      include: { marketingCard: true },
      orderBy: { createdAt: 'desc' },
    });
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
