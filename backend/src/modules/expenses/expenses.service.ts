import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService } from '../cards/invoices.service';
import { RecurrenceService } from './recurrence.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CsvConfirmRowDto } from './dto/csv-import.dto';
import { calculateInstallments } from './utils/installment-math.util';
import { resolveCycleForTransaction } from '../cards/utils/billing-cycle.util';
import {
  parseCsvText,
  validateCsvRows,
  CsvRowValidationResult,
} from './utils/csv-parser.util';
import {
  PaymentMethod,
  PaymentStatus,
  Prisma,
  Expense,
} from '@prisma/client';
import { randomUUID } from 'crypto';

export interface ExpenseFilters {
  month?: number;
  year?: number;
  method?: PaymentMethod;
  categoryId?: string;
  cardId?: string;
  status?: PaymentStatus;
  search?: string;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
    private readonly recurrenceService: RecurrenceService,
  ) {}

  /**
   * Lists expenses for the active account with optional month/year and criteria filtering.
   */
  async list(accountId: string, filters: ExpenseFilters = {}): Promise<Expense[]> {
    const where: Prisma.ExpenseWhereInput = { accountId };

    if (filters.method) {
      where.paymentMethod = filters.method;
    }
    if (filters.status) {
      where.paymentStatus = filters.status;
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters.cardId) {
      where.cardId = filters.cardId;
    }

    if (filters.search && filters.search.trim()) {
      where.description = {
        contains: filters.search.trim(),
        mode: 'insensitive',
      };
    }

    if (filters.year && filters.month) {
      const start = new Date(Date.UTC(filters.year, filters.month - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999));

      where.OR = [
        { transactionDate: { gte: start, lte: end } },
        { dueDate: { gte: start, lte: end } },
      ];
    } else if (filters.year) {
      const start = new Date(Date.UTC(filters.year, 0, 1, 0, 0, 0));
      const end = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999));

      where.OR = [
        { transactionDate: { gte: start, lte: end } },
        { dueDate: { gte: start, lte: end } },
      ];
    }

    return this.prisma.expense.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
        card: {
          select: { id: true, nickname: true, brand: true },
        },
      },
      orderBy: [{ dueDate: 'asc' }, { transactionDate: 'asc' }],
    });
  }

  /**
   * Retrieves a single expense by ID.
   */
  async findById(accountId: string, id: string): Promise<Expense> {
    const expense = await this.prisma.expense.findFirst({
      where: { id, accountId },
      include: {
        category: true,
        card: true,
        invoice: true,
      },
    });

    if (!expense) {
      throw new NotFoundException({
        code: 'EXP006',
        message: 'Expense not found in this account.',
      });
    }

    return expense;
  }

  /**
   * Creates an expense (Cash, Credit Card with multi-installment splitting, or Recurring).
   */
  async create(accountId: string, dto: CreateExpenseDto): Promise<any> {
    // Validate category belongs to this account
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, accountId },
    });

    if (!category) {
      throw new NotFoundException({
        code: 'EXP005',
        message: 'Selected category not found in this account.',
      });
    }

    const txDate = new Date(dto.transactionDate);

    // Flow 1: Recurring monthly expense
    if (dto.isRecurring) {
      const dayOfMonth = txDate.getUTCDate();
      const rule = await this.recurrenceService.createRuleAndMaterialize({
        accountId,
        description: dto.description.trim(),
        amount: dto.amount,
        dayOfMonth,
        startDate: txDate,
        paymentMethod: dto.paymentMethod,
        categoryId: dto.categoryId,
        cardId: dto.cardId || null,
      });

      return {
        isRecurring: true,
        recurrenceRuleId: rule.id,
        description: rule.description,
        amount: Number(rule.amount),
        projectionsGenerated: 12,
      };
    }

    // Flow 2: Credit Card purchase with installment allocation
    if (dto.paymentMethod === PaymentMethod.CREDIT_CARD) {
      if (!dto.cardId) {
        throw new BadRequestException({
          code: 'EXP004',
          message:
            'Credit card payment method requires a valid cardId belonging to this account.',
        });
      }

      const card = await this.prisma.creditCard.findFirst({
        where: { id: dto.cardId, accountId },
      });

      if (!card) {
        throw new BadRequestException({
          code: 'EXP004',
          message: 'Selected credit card not found in this account.',
        });
      }

      const installmentCount = dto.installments || 1;
      const breakdowns = calculateInstallments(dto.amount, installmentCount);

      // Determine starting cycle based on transaction date and closing day
      const startCycle = resolveCycleForTransaction(txDate, card.closingDay);

      const installmentGroupId = randomUUID();
      const createdRecords: Expense[] = [];

      let iterYear = startCycle.billingYear;
      let iterMonth = startCycle.billingMonth;

      for (const breakdown of breakdowns) {
        // Ensure rolling invoices exist for card
        await this.invoicesService.ensureCycleInvoices(
          accountId,
          card.id,
          card.closingDay,
          card.dueDay,
          new Date(Date.UTC(iterYear, iterMonth - 1, 1)),
        );

        const targetInvoice = await this.prisma.invoice.findFirst({
          where: {
            cardId: card.id,
            billingYear: iterYear,
            billingMonth: iterMonth,
          },
        });

        const invoiceId = targetInvoice ? targetInvoice.id : null;
        const dueDate = targetInvoice ? targetInvoice.dueDate : txDate;

        const expense = await this.prisma.expense.create({
          data: {
            accountId,
            description: dto.description.trim(),
            amount: new Prisma.Decimal(breakdown.amount.toFixed(2)),
            transactionDate: txDate,
            dueDate,
            paymentMethod: PaymentMethod.CREDIT_CARD,
            paymentStatus: PaymentStatus.PENDING,
            categoryId: dto.categoryId,
            cardId: card.id,
            invoiceId,
            installmentGroupId,
            installmentNumber: breakdown.installmentNumber,
            installmentTotal: installmentCount,
            notes: dto.notes ? dto.notes.trim() : null,
          },
        });

        createdRecords.push(expense);

        // Update target invoice total
        if (targetInvoice) {
          await this.prisma.invoice.update({
            where: { id: targetInvoice.id },
            data: {
              totalAmount: {
                increment: new Prisma.Decimal(breakdown.amount.toFixed(2)),
              },
            },
          });
        }

        // Advance to next calendar cycle for subsequent installment
        iterMonth++;
        if (iterMonth > 12) {
          iterMonth = 1;
          iterYear++;
        }
      }

      return {
        installmentGroupId,
        totalAmount: dto.amount,
        installmentsGenerated: createdRecords.length,
        records: createdRecords,
      };
    }

    // Flow 3: Single Cash Expense (Debit, Pix, Boleto)
    let calculatedDueDate = txDate;
    if (dto.dueDate) {
      calculatedDueDate = new Date(dto.dueDate);
    } else if (dto.paymentMethod === PaymentMethod.BOLETO) {
      // Default Boleto due date = txDate + 3 days
      calculatedDueDate = new Date(txDate.getTime() + 3 * 86400000);
    }

    const expense = await this.prisma.expense.create({
      data: {
        accountId,
        description: dto.description.trim(),
        amount: new Prisma.Decimal(dto.amount.toFixed(2)),
        transactionDate: txDate,
        dueDate: calculatedDueDate,
        paymentMethod: dto.paymentMethod,
        paymentStatus: dto.paymentStatus || PaymentStatus.PENDING,
        categoryId: dto.categoryId,
        notes: dto.notes ? dto.notes.trim() : null,
      },
      include: {
        category: true,
      },
    });

    return expense;
  }

  /**
   * Updates an expense, optionally cascading changes to future installments in a series.
   */
  async update(
    accountId: string,
    id: string,
    dto: UpdateExpenseDto,
  ): Promise<Expense> {
    const expense = await this.findById(accountId, id);

    const dataToUpdate: Prisma.ExpenseUpdateInput = {};

    if (dto.description) {
      dataToUpdate.description = dto.description.trim();
    }
    if (dto.amount !== undefined) {
      dataToUpdate.amount = new Prisma.Decimal(dto.amount.toFixed(2));
    }
    if (dto.paymentStatus) {
      dataToUpdate.paymentStatus = dto.paymentStatus;
    }
    if (dto.notes !== undefined) {
      dataToUpdate.notes = dto.notes ? dto.notes.trim() : null;
    }
    if (dto.dueDate) {
      dataToUpdate.dueDate = new Date(dto.dueDate);
    }

    if (dto.categoryId) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, accountId },
      });
      if (!category) {
        throw new NotFoundException({
          code: 'EXP005',
          message: 'Selected category not found in this account.',
        });
      }
      dataToUpdate.category = { connect: { id: dto.categoryId } };
    }

    if (
      dto.scope === 'FUTURE' &&
      expense.installmentGroupId &&
      expense.installmentNumber
    ) {
      // Cascade description and category to future installments in this group
      await this.prisma.expense.updateMany({
        where: {
          accountId,
          installmentGroupId: expense.installmentGroupId,
          installmentNumber: { gte: expense.installmentNumber },
        },
        data: {
          description: dataToUpdate.description,
          categoryId: dto.categoryId,
        },
      });
    }

    return this.prisma.expense.update({
      where: { id },
      data: dataToUpdate,
      include: {
        category: true,
        card: true,
      },
    });
  }

  /**
   * Deletes an expense or cascades deletion across all future installments.
   */
  async delete(
    accountId: string,
    id: string,
    scope: 'SINGLE' | 'FUTURE' = 'SINGLE',
  ): Promise<{ deletedCount: number }> {
    const expense = await this.findById(accountId, id);

    if (
      scope === 'FUTURE' &&
      expense.installmentGroupId &&
      expense.installmentNumber
    ) {
      const futureInstallments = await this.prisma.expense.findMany({
        where: {
          accountId,
          installmentGroupId: expense.installmentGroupId,
          installmentNumber: { gte: expense.installmentNumber },
        },
      });

      for (const inst of futureInstallments) {
        if (inst.invoiceId) {
          await this.prisma.invoice.update({
            where: { id: inst.invoiceId },
            data: {
              totalAmount: {
                decrement: inst.amount,
              },
            },
          });
        }
      }

      const res = await this.prisma.expense.deleteMany({
        where: {
          accountId,
          installmentGroupId: expense.installmentGroupId,
          installmentNumber: { gte: expense.installmentNumber },
        },
      });

      return { deletedCount: res.count };
    }

    // Single deletion
    if (expense.invoiceId) {
      await this.prisma.invoice.update({
        where: { id: expense.invoiceId },
        data: {
          totalAmount: {
            decrement: expense.amount,
          },
        },
      });
    }

    await this.prisma.expense.delete({
      where: { id },
    });

    return { deletedCount: 1 };
  }

  /**
   * Parses and validates a CSV file against the active account's categories and cards.
   */
  async previewCsv(
    accountId: string,
    csvContent: string,
  ): Promise<{
    totalRows: number;
    validRows: number;
    invalidRows: number;
    items: CsvRowValidationResult[];
  }> {
    const [categories, cards] = await Promise.all([
      this.prisma.category.findMany({
        where: { accountId },
        select: { id: true, name: true },
      }),
      this.prisma.creditCard.findMany({
        where: { accountId },
        select: { id: true, nickname: true },
      }),
    ]);

    const parsedMatrix = parseCsvText(csvContent);
    const results = validateCsvRows(parsedMatrix, categories, cards);

    const validRows = results.filter((r) => r.isValid).length;
    const invalidRows = results.length - validRows;

    return {
      totalRows: results.length,
      validRows,
      invalidRows,
      items: results,
    };
  }

  /**
   * Atomically commits validated CSV rows to the database.
   */
  async confirmCsvImport(
    accountId: string,
    rows: CsvConfirmRowDto[],
  ): Promise<{ importedCount: number }> {
    let importedCount = 0;

    for (const row of rows) {
      await this.create(accountId, {
        description: row.description,
        amount: row.amount,
        transactionDate: row.transactionDate,
        paymentMethod: row.paymentMethod,
        categoryId: row.categoryId,
        cardId: row.cardId,
        installments: row.installments || 1,
        notes: row.notes,
      });
      importedCount++;
    }

    return { importedCount };
  }
}
