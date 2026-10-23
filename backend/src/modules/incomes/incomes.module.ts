import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoriesModule } from '../categories/categories.module';
import { IncomesController } from './incomes.controller';
import { IncomesService } from './incomes.service';
import { IncomeRecurrenceService } from './income-recurrence.service';

@Module({
  imports: [PrismaModule, CategoriesModule],
  controllers: [IncomesController],
  providers: [IncomesService, IncomeRecurrenceService],
  exports: [IncomesService],
})
export class IncomesModule {}
