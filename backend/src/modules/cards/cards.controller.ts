import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  ParseBoolPipe,
} from '@nestjs/common';
import { CardsService } from './cards.service';
import { InvoicesService } from './invoices.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountContextGuard } from '../../common/guards/account-context.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('cards')
@UseGuards(JwtAuthGuard, AccountContextGuard)
export class CardsController {
  constructor(
    private readonly cardsService: CardsService,
    private readonly invoicesService: InvoicesService,
  ) {}

  @Get()
  async list(
    @CurrentAccount('id') accountId: string,
    @Query('includeArchived') includeArchived?: string,
  ) {
    const shouldInclude = includeArchived === 'true';
    const cards = await this.cardsService.list(accountId, shouldInclude);
    return {
      status: 'success',
      data: cards,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentAccount('id') accountId: string,
    @Body() dto: CreateCardDto,
  ) {
    const card = await this.cardsService.create(accountId, dto);
    return {
      status: 'success',
      data: card,
    };
  }

  @Get(':id')
  async getOne(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
  ) {
    const card = await this.cardsService.findById(accountId, id);
    return {
      status: 'success',
      data: card,
    };
  }

  @Patch(':id')
  async update(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCardDto,
  ) {
    const card = await this.cardsService.update(accountId, id, dto);
    return {
      status: 'success',
      data: card,
    };
  }

  @Delete(':id')
  async delete(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
  ) {
    await this.cardsService.delete(accountId, id);
    return {
      status: 'success',
      message: 'Credit card successfully deleted.',
    };
  }

  @Get(':id/invoices')
  async getInvoices(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Query('year') year?: string,
  ) {
    const parsedYear = year ? parseInt(year, 10) : undefined;
    const invoices = await this.invoicesService.getInvoicesForCard(
      accountId,
      id,
      parsedYear,
    );
    return {
      status: 'success',
      data: invoices,
    };
  }
}
