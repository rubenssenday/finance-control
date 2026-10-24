import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './modules/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { AccountsModule } from './modules/accounts/accounts.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { CardsModule } from './modules/cards/cards.module';
import { ExpensesModule } from './modules/expenses/expenses.module';
import { IncomesModule } from './modules/incomes/incomes.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    PrismaModule,
    AuthModule,
    AccountsModule,
    CategoriesModule,
    CardsModule,
    ExpensesModule,
    IncomesModule,
    DashboardModule,
  ],
})
export class AppModule {}
