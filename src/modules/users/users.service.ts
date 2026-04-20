import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const USER_SELECT = {
  id: true,
  name: true,
  surname: true,
  email: true,
  phone: true,
  balance: true,
  role: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({ select: USER_SELECT });
  }

  async findOne(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) {
      throw new NotFoundException(`Користувача з id ${id} не знайдено`);
    }

    return user;
  }

  async updateProfile(userId: number, dto: UpdateUserDto) {
    // Якщо юзер хоче змінити email — перевіряємо чи він не зайнятий
    if (dto.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });

      if (existing && existing.id !== userId) {
        throw new ConflictException('Цей email вже використовується');
      }
    }

    // Оновлюємо тільки ті поля які прийшли (решта не чіпаємо)
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: dto,
      select: {
        id: true,
        name: true,
        surname: true,
        email: true,
        phone: true,
        balance: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updated;
  }
}
