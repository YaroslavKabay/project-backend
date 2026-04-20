import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserProjectDto } from './dto/create-user-project.dto';

@Injectable()
export class UserProjectsService {
  constructor(private readonly prisma: PrismaService) {}

  // Admin: всі user-projects без фільтрів
  async findAll() {
    return this.prisma.userProject.findMany({
      include: {
        user: { select: { id: true, name: true, surname: true, email: true } },
        project: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Проекти поточного юзера
  async findAllByUser(userId: number) {
    return this.prisma.userProject.findMany({
      where: { userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // Один UserProject поточного юзера
  async findOneByUser(id: number, userId: number) {
    const userProject = await this.prisma.userProject.findFirst({
      where: { id, userId },
      include: {
        project: {
          select: {
            id: true,
            title: true,
            status: true,
          },
        },
        investments: true,
      },
    });

    if (!userProject) {
      throw new NotFoundException(`UserProject з id ${id} не знайдено`);
    }

    return userProject;
  }

  // Admin — приєднати юзера до проекту
  async create(dto: CreateUserProjectDto) {
    // Перевіряємо чи існують юзер і проект
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
    });
    if (!user) {
      throw new NotFoundException(`Користувач з id ${dto.userId} не знайдений`);
    }

    const project = await this.prisma.project.findUnique({
      where: { id: dto.projectId },
    });
    if (!project) {
      throw new NotFoundException(`Проект з id ${dto.projectId} не знайдено`);
    }

    // Перевіряємо чи юзер вже не в цьому проекті (@@unique([userId, projectId]))
    const existing = await this.prisma.userProject.findUnique({
      where: {
        userId_projectId: { userId: dto.userId, projectId: dto.projectId },
      },
    });
    if (existing) {
      throw new ConflictException(`Користувач вже є учасником цього проекту`);
    }

    return this.prisma.userProject.create({
      data: dto,
      include: {
        project: { select: { id: true, title: true, status: true } },
        user: { select: { id: true, name: true, surname: true, email: true } },
      },
    });
  }

  // Admin — видалити юзера з проекту
  async remove(id: number) {
    const userProject = await this.prisma.userProject.findUnique({
      where: { id },
    });

    if (!userProject) {
      throw new NotFoundException(`UserProject з id ${id} не знайдено`);
    }

    return this.prisma.userProject.delete({ where: { id } });
  }
}
