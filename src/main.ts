import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 🛡️ HELMET - Security Headers (захист від XSS, clickjacking, MIME sniffing)
  app.use(helmet());

  // 🍪 COOKIE PARSER - парсить HTTP cookies в req.cookies об'єкт
  app.use(cookieParser());

  // 🌍 CORS - дозволяє фронтенду робити запити з браузера
  app.enableCors({
    origin: [
      'http://localhost:3000', // Next.js dev server
      'http://localhost:3001', // Next.js альтернативний порт (якщо 3000 зайнятий)
      // TODO: Додати продакшн домен коли буде готовий
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    credentials: true, // Дозволити cookies та Authorization headers
  });

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
