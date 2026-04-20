import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { MarketingCardsService } from '../../marketing-cards/marketing-cards.service';
import { CreateMarketingCardDto } from '../../marketing-cards/dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from '../../marketing-cards/dto/update-marketing-card.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';

@UseGuards(AdminJwtAuthGuard)
@Controller('backoffice/marketing-cards')
export class BackofficeMarketingCardsController {
  constructor(private readonly marketingCardsService: MarketingCardsService) {}

  @Get()
  findAll() {
    return this.marketingCardsService.findAll();
  }

  @Post()
  create(@Body() dto: CreateMarketingCardDto) {
    return this.marketingCardsService.create(dto);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateMarketingCardDto) {
    return this.marketingCardsService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marketingCardsService.remove(id);
  }
}
