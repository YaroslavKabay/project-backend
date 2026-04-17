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
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { MarketingCardsService } from './marketing-cards.service';
import { CreateMarketingCardDto } from './dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from './dto/update-marketing-card.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('marketing-cards')
export class MarketingCardsController {
  constructor(private readonly marketingCardsService: MarketingCardsService) {}

  // Публічний — для лендінгу і дашборду
  @Get()
  findAll() {
    return this.marketingCardsService.findAll();
  }

  // Публічний — деталі однієї картки
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.marketingCardsService.findOne(id);
  }

  // Тільки Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateMarketingCardDto) {
    return this.marketingCardsService.create(dto);
  }

  // Тільки Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketingCardDto,
  ) {
    return this.marketingCardsService.update(id, dto);
  }

  // Тільки Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marketingCardsService.remove(id);
  }
}
