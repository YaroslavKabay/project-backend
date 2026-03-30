import { Module } from '@nestjs/common';
import { MarketingCardsController } from './marketing-cards.controller';
import { MarketingCardsService } from './marketing-cards.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [MarketingCardsController],
  providers: [MarketingCardsService],
  exports: [MarketingCardsService],
})
export class MarketingCardsModule {}
