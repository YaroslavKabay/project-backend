import { Module } from '@nestjs/common';
import { DividendsController } from './dividends.controller';
import { DividendsService } from './dividends.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [DividendsController],
  providers: [DividendsService],
})
export class DividendsModule {}
