import { Module } from '@nestjs/common';
import { ExpensesController } from './expenses.controller';
import { ExpensesService } from './expenses.service';
import { RecurrenceService } from './recurrence.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CardsModule } from '../cards/cards.module';
import { CategoriesModule } from '../categories/categories.module';

@Module({
  imports: [PrismaModule, CardsModule, CategoriesModule],
  controllers: [ExpensesController],
  providers: [ExpensesService, RecurrenceService],
  exports: [ExpensesService, RecurrenceService],
})
export class ExpensesModule {}
