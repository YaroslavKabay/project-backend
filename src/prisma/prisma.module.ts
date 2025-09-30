import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Робимо модуль глобальним, щоб не імпортувати в кожен модуль
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Експортуємо сервіс для використання в інших модулях
})
export class PrismaModule {}
