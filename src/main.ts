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
  // ⚠️ https://*.vercel.app НЕ працює — Express трактує * як літерал, тому використовуємо функцію
  app.enableCors({
    origin: (
      origin: string | undefined,
      callback: (err: Error | null, allow?: boolean) => void,
    ) => {
      const allowed = [
        'http://localhost:3000',
        'http://localhost:3001',
        'https://vc-project-ui.vercel.app',
      ];
      const isAllowed =
        !origin || // Same-origin (наприклад, Postman)
        allowed.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.endsWith('.railway.app');
      callback(null, isAllowed);
    },
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
