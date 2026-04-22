import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { MarketingCardsService } from '../../marketing-cards/marketing-cards.service';
import { CreateMarketingCardDto } from '../../marketing-cards/dto/create-marketing-card.dto';
import { UpdateMarketingCardDto } from '../../marketing-cards/dto/update-marketing-card.dto';
import { AdminJwtAuthGuard } from '../../admin-auth/guards/admin-jwt-auth.guard';
import { AdminRolesGuard } from '../../admin-auth/guards/admin-roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { BackofficeMarketingCardsQueryDto } from '../dto/backoffice-marketing-cards-query.dto';

@UseGuards(AdminJwtAuthGuard, AdminRolesGuard)
@Controller('backoffice/marketing-cards')
export class BackofficeMarketingCardsController {
  constructor(private readonly marketingCardsService: MarketingCardsService) {}

  @Get()
  findAll(@Query() filters: BackofficeMarketingCardsQueryDto) {
    return this.marketingCardsService.findAll(filters);
  }

  @Post()
  create(@Body() dto: CreateMarketingCardDto) {
    return this.marketingCardsService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateMarketingCardDto,
  ) {
    return this.marketingCardsService.update(id, dto);
  }

  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.marketingCardsService.remove(id);
  }
}
