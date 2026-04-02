import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { DividendsModule } from '../dividends/dividends.module';
import { InvestmentsModule } from '../investments/investments.module';
import { UserProjectsModule } from '../user-projects/user-projects.module';

@Module({
  imports: [PrismaModule, TransactionsModule, DividendsModule, InvestmentsModule, UserProjectsModule],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService],
})
export class UsersModule {}
