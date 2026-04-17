import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DividendsService } from './dividends.service';
import { CreateDividendDto } from './dto/create-dividend.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole, DividendStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { UserDividendsQueryDto } from './dto/user-dividends-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('dividends')
export class DividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  // User: власні дивіденди з фільтрами та пагінацією
  @Get()
  findMyDividends(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UserDividendsQueryDto,
  ) {
    return this.dividendsService.findAllForUser(user.id, query);
  }

  // Admin: всі дивіденди з опційним фільтром
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get('admin')
  findAll(
    @Query('userId') userId?: string,
    @Query('investmentId') investmentId?: string,
  ) {
    return this.dividendsService.findAll(
      userId ? parseInt(userId, 10) : undefined,
      investmentId ? parseInt(investmentId, 10) : undefined,
    );
  }

  // Admin: одиничний дивіденд
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.dividendsService.findOne(id);
  }

  // Admin: нарахування дивіденду (статус PENDING за замовчуванням)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Post()
  create(@Body() dto: CreateDividendDto) {
    return this.dividendsService.create(dto);
  }

  // Admin: виплата або скасування дивіденду
  // PAID → зараховує суму на баланс юзера + створює Transaction
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @Patch(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: DividendStatus,
  ) {
    return this.dividendsService.updateStatus(id, status);
  }

  // Admin: видалення (тільки PENDING/CANCELLED дивіденди)
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.dividendsService.remove(id);
  }
}
