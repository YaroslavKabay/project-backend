import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DividendsService } from './dividends.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';
import { UserDividendsQueryDto } from './dto/user-dividends-query.dto';

@UseGuards(JwtAuthGuard)
@Controller('dividends')
export class DividendsController {
  constructor(private readonly dividendsService: DividendsService) {}

  @Get()
  findMyDividends(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: UserDividendsQueryDto,
  ) {
    return this.dividendsService.findAllForUser(user.id, query);
  }
}
