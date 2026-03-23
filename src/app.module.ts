import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import * as Joi from 'joi';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';

@Module({
  imports: [
    // 🔧 КОНФІГУРАЦІЯ + ВАЛІДАЦІЯ ENVIRONMENT ЗМІННИХ (стандартний підхід)
    ConfigModule.forRoot({
      isGlobal: true, // Доступний у всіх модулях
      validationSchema: Joi.object({
        JWT_SECRET: Joi.string().min(32).required(),
        DATABASE_URL: Joi.string().required(),
        ACCESS_TOKEN_EXPIRES_IN: Joi.string().default('2h'),
        REFRESH_TOKEN_EXPIRES_IN: Joi.string().default('14d'),
        NODE_ENV: Joi.string()
          .valid('development', 'production', 'test')
          .default('development'),
        PORT: Joi.number().default(3000),
        // 📧 SENDGRID EMAIL СЕРВІС
        SENDGRID_API_KEY: Joi.string().required(),
        SENDGRID_FROM_EMAIL: Joi.string().email().required(),
      }),
      validationOptions: {
        abortEarly: false, // Показати всі помилки валідації, не тільки першу
      },
    }),
    // 🛡️ RATE LIMITING - захист від brute force атак

    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 секунд
        limit: 10, // Максимум 10 запитів на хвилину на один IP
      },
    ]),
    PrismaModule,
    AuthModule,
    UsersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
