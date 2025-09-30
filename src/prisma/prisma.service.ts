import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '../../generated/prisma';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    // З'єднання з базою даних при ініціалізації модуля
    await this.$connect();
    console.log('🔗 Connected to PostgreSQL database');
  }

  async onModuleDestroy() {
    // Закриття з'єднання при завершенні роботи
    await this.$disconnect();
    console.log('🔌 Disconnected from PostgreSQL database');
  }
}
