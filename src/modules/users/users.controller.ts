import { Controller, Put, Get, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { InvestmentsService } from '../investments/investments.service';
import { UserProjectsService } from '../user-projects/user-projects.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../auth/types/auth.types';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly investmentsService: InvestmentsService,
    private readonly userProjectsService: UserProjectsService,
  ) {}

  @Get('me/investments')
  getMyInvestments(@CurrentUser() user: AuthenticatedUser) {
    return this.investmentsService.findAllForUser(user.id);
  }

  @Get('me/projects')
  getMyProjects(@CurrentUser() user: AuthenticatedUser) {
    return this.userProjectsService.findAllByUser(user.id);
  }

  @Put('profile')
  async updateProfile(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.updateProfile(user.id, dto);
  }
}
