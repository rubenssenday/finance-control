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
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { ConfirmCsvImportDto } from './dto/csv-import.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountContextGuard } from '../../common/guards/account-context.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

@Controller('expenses')
@UseGuards(JwtAuthGuard, AccountContextGuard)
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Get()
  async list(
    @CurrentAccount('id') accountId: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
    @Query('method') method?: PaymentMethod,
    @Query('categoryId') categoryId?: string,
    @Query('cardId') cardId?: string,
    @Query('status') status?: PaymentStatus,
    @Query('search') search?: string,
  ) {
    const parsedMonth = month ? parseInt(month, 10) : undefined;
    const parsedYear = year ? parseInt(year, 10) : undefined;

    const expenses = await this.expensesService.list(accountId, {
      month: parsedMonth,
      year: parsedYear,
      method,
      categoryId,
      cardId,
      status,
      search,
    });

    return {
      status: 'success',
      data: expenses,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @CurrentAccount('id') accountId: string,
    @Body() dto: CreateExpenseDto,
  ) {
    const expense = await this.expensesService.create(accountId, dto);
    return {
      status: 'success',
      data: expense,
    };
  }

  @Get(':id')
  async getOne(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
  ) {
    const expense = await this.expensesService.findById(accountId, id);
    return {
      status: 'success',
      data: expense,
    };
  }

  @Patch(':id')
  async update(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    const expense = await this.expensesService.update(accountId, id, dto);
    return {
      status: 'success',
      data: expense,
    };
  }

  @Delete(':id')
  async delete(
    @CurrentAccount('id') accountId: string,
    @Param('id') id: string,
    @Query('scope') scope?: 'SINGLE' | 'FUTURE',
  ) {
    const result = await this.expensesService.delete(accountId, id, scope);
    return {
      status: 'success',
      message: 'Expense(s) successfully deleted.',
      deletedCount: result.deletedCount,
    };
  }

  @Post('import/preview')
  @UseInterceptors(FileInterceptor('file'))
  async previewCsv(
    @CurrentAccount('id') accountId: string,
    @UploadedFile() file?: any,
    @Body('csvContent') csvContent?: string,
  ) {
    let contentToParse = '';

    if (file && file.buffer) {
      contentToParse = file.buffer.toString('utf-8');
    } else if (csvContent) {
      contentToParse = csvContent;
    } else {
      throw new BadRequestException({
        code: 'CSV001',
        message: 'No CSV file or csvContent provided for preview.',
      });
    }

    const preview = await this.expensesService.previewCsv(
      accountId,
      contentToParse,
    );

    return {
      status: 'success',
      data: preview,
    };
  }

  @Post('import/confirm')
  @HttpCode(HttpStatus.CREATED)
  async confirmCsvImport(
    @CurrentAccount('id') accountId: string,
    @Body() dto: ConfirmCsvImportDto,
  ) {
    const result = await this.expensesService.confirmCsvImport(
      accountId,
      dto.rows,
    );

    return {
      status: 'success',
      data: result,
    };
  }
}
