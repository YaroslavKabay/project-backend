import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ ГЛОБАЛЬНА ВАЛІДАЦІЯ - перевіряє всі DTO автоматично
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Видаляє поля що не описані в DTO
      forbidNonWhitelisted: true, // Викидає помилку на зайві поля
      transform: true, // Автоматично застосовує @Transform декоратори
      transformOptions: {
        enableImplicitConversion: true, // "123" → 123 автоматично
      },
    }),
  );

  await app.listen(process.env.PORT ?? 3000);
}

bootstrap().catch((error) => {
  console.error('❌ Помилка запуску сервера:', error);
  process.exit(1);
});
