import { Module } from '@nestjs/common';
import { CardsController } from './cards.controller';
import { CardsService } from './cards.service';
import { InvoicesService } from './invoices.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CardsController],
  providers: [CardsService, InvoicesService],
  exports: [CardsService, InvoicesService],
})
export class CardsModule {}
