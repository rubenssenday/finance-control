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
  BadRequestException,
} from '@nestjs/common';
import { IncomesService } from './incomes.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountContextGuard } from '../../common/guards/account-context.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { IncomeStatus } from '@prisma/client';

@Controller('incomes')
@UseGuards(JwtAuthGuard, AccountContextGuard)
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Get()
  async list(
    @CurrentAccount('id') accountId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('categoryId') categoryId?: string,
    @Query('status') status?: IncomeStatus,
    @Query('search') search?: string,
  ) {
    const parsedMonth = month ? parseInt(month, 10) : undefined;
    const parsedYear = year ? parseInt(year, 10) : undefined;

    const incomes = await this.incomesService.list(accountId, {
      month: parsedMonth,
      year: parsedYear,
      categoryId,
      status,
      search,
    });

    return {
      status: 'success',
      data: incomes,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentAccount('id') accountId: string,
    @Body() dto: CreateIncomeDto,
  ) {
    const income = await this.incomesService.create(accountId, dto);
    return {
      status: 'success',
      data: income,
    };
  }

  @Get(':id')
  async getOne(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
  ) {
    const income = await this.incomesService.findById(accountId, id);
    return {
      status: 'success',
      data: income,
    };
  }

  @Patch(':id')
  async update(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ) {
    const income = await this.incomesService.update(accountId, id, dto);
    return {
      status: 'success',
      data: income,
    };
  }

  @Delete(':id')
  async delete(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Query('scope') scope?: 'SINGLE' | 'FUTURE',
  ) {
    if (scope && scope !== 'SINGLE' && scope !== 'FUTURE') {
      throw new BadRequestException({
        code: 'INC007',
        message: 'Invalid deletion scope specified (must be SINGLE or FUTURE).',
      });
    }

    const result = await this.incomesService.delete(accountId, id, scope);
    return {
      status: 'success',
      message: 'Income(s) successfully deleted.',
      deletedCount: result.deletedCount,
    };
  }
}
