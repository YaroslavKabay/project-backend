import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateMarketingCardDto } from './dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from './dto/update-marketing-card.dto';

@Injectable()
export class MarketingCardsService {
  constructor(private readonly prisma: PrismaService) {}

  // Публічний — список всіх карток для лендінгу і дашборду
  async findAll() {
    return this.prisma.marketingCard.findMany({
      include: { project: { select: { id: true, status: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Публічний — одна картка
  async findOne(id: number) {
    const card = await this.prisma.marketingCard.findUnique({
      where: { id },
      include: { project: { select: { id: true, status: true } } },
    });

    if (!card) {
      throw new NotFoundException(`Маркетингова картка з id ${id} не знайдена`);
    }

    return card;
  }

  // Admin — створити картку для проекту
  async create(dto: CreateMarketingCardDto) {
    // Перевіряємо чи проект існує
    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });

    if (!project) {
      throw new NotFoundException(`Проект з id ${dto.projectId} не знайдено`);
    }

    // Перевіряємо чи у проекту вже немає картки (hasOne)
    const existing = await this.prisma.marketingCard.findUnique({
      where: { projectId: dto.projectId },
    });

    if (existing) {
      throw new ConflictException(
        `Проект з id ${dto.projectId} вже має маркетингову картку`,
      );
    }

    return this.prisma.marketingCard.create({
      data: dto,
      include: { project: { select: { id: true, status: true } } },
    });
  }

  // Admin — оновити картку
  async update(id: number, dto: UpdateMarketingCardDto) {
    await this.findOne(id);

    return this.prisma.marketingCard.update({
      where: { id },
      data: dto,
      include: { project: { select: { id: true, status: true } } },
    });
  }

  // Admin — видалити картку
  async remove(id: number) {
    await this.findOne(id);

    return this.prisma.marketingCard.delete({
      where: { id },
    });
  }
}
