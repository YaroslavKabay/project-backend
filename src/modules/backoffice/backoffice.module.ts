import { Module } from '@nestjs/common';
import { AdminAuthModule } from '../admin-auth/admin-auth.module';
import { ProjectsModule } from '../projects/projects.module';
import { UsersModule } from '../users/users.module';
import { UserProjectsModule } from '../user-projects/user-projects.module';
import { InvestmentsModule } from '../investments/investments.module';
import { DividendsModule } from '../dividends/dividends.module';
import { TransactionsModule } from '../transactions/transactions.module';
import { MarketingCardsModule } from '../marketing-cards/marketing-cards.module';
import { BackofficeProjectsController } from './controllers/backoffice-projects.controller';
import { BackofficeUsersController } from './controllers/backoffice-users.controller';
import { BackofficeUserProjectsController } from './controllers/backoffice-user-projects.controller';
import { BackofficeInvestmentsController } from './controllers/backoffice-investments.controller';
import { BackofficeDividendsController } from './controllers/backoffice-dividends.controller';
import { BackofficeTransactionsController } from './controllers/backoffice-transactions.controller';
import { BackofficeMarketingCardsController } from './controllers/backoffice-marketing-cards.controller';

@Module({
  imports: [
    AdminAuthModule,
    ProjectsModule,
    UsersModule,
    UserProjectsModule,
    InvestmentsModule,
    DividendsModule,
    TransactionsModule,
    MarketingCardsModule,
  ],
  controllers: [
    BackofficeProjectsController,
    BackofficeUsersController,
    BackofficeUserProjectsController,
    BackofficeInvestmentsController,
    BackofficeDividendsController,
    BackofficeTransactionsController,
    BackofficeMarketingCardsController,
  ],
})
export class BackofficeModule {}
