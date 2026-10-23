import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeRecurrenceService } from './income-recurrence.service';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import {
  Income,
  IncomeStatus,
  CategoryType,
  Prisma,
} from '@prisma/client';

export interface IncomeFilters {
  month?: number;
  year?: number;
  categoryId?: string;
  status?: IncomeStatus;
  search?: string;
}

@Injectable()
export class IncomesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly incomeRecurrenceService: IncomeRecurrenceService,
  ) {}

  /**
   * Lists incomes for the active account with optional month/year and search criteria.
   * Filters strictly by `receiptDate` (deposit date) to represent monthly cash inflow.
   */
  async list(accountId: string, filters: IncomeFilters = {}): Promise<Income[]> {
    const where: Prisma.IncomeWhereInput = { accountId };

    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.categoryId) {
      where.categoryId = filters.categoryId;
    }

    if (filters.search && filters.search.trim()) {
      where.OR = [
        {
          description: {
            contains: filters.search.trim(),
            mode: 'insensitive',
          },
        },
        {
          notes: {
            contains: filters.search.trim(),
            mode: 'insensitive',
          },
        },
      ];
    }

    if (filters.year && filters.month) {
      const start = new Date(Date.UTC(filters.year, filters.month - 1, 1, 0, 0, 0));
      const end = new Date(Date.UTC(filters.year, filters.month, 0, 23, 59, 59, 999));

      where.receiptDate = { gte: start, lte: end };
    } else if (filters.year) {
      const start = new Date(Date.UTC(filters.year, 0, 1, 0, 0, 0));
      const end = new Date(Date.UTC(filters.year, 11, 31, 23, 59, 59, 999));

      where.receiptDate = { gte: start, lte: end };
    }

    return this.prisma.income.findMany({
      where,
      include: {
        category: {
          select: { id: true, name: true, color: true, icon: true },
        },
      },
      orderBy: [{ receiptDate: 'asc' }, { createdAt: 'asc' }],
    });
  }

  /**
   * Retrieves a single income by ID and account context.
   */
  async findById(accountId: string, id: string): Promise<Income> {
    const income = await this.prisma.income.findFirst({
      where: { id, accountId },
      include: {
        category: true,
      },
    });

    if (!income) {
      throw new NotFoundException({
        code: 'INC006',
        message: 'Income record not found in this account.',
      });
    }

    return income;
  }

  /**
   * Creates an income record (single deposit or recurring monthly template with 12-month projections).
   */
  async create(accountId: string, dto: CreateIncomeDto): Promise<any> {
    // Validate category exists in this account
    const category = await this.prisma.category.findFirst({
      where: { id: dto.categoryId, accountId },
    });

    if (!category) {
      throw new NotFoundException({
        code: 'INC004',
        message: 'Selected category not found in this account.',
      });
    }

    // Validate category type must be INCOME
    if (category.type !== CategoryType.INCOME) {
      throw new BadRequestException({
        code: 'INC005',
        message: 'Selected category is not an income category (type must be INCOME).',
      });
    }

    const receiptDate = new Date(dto.receiptDate);
    const now = new Date();

    // Validate receipt date does not exceed 24 months into the future
    const maxFutureDate = new Date();
    maxFutureDate.setUTCMonth(maxFutureDate.getUTCMonth() + 24);
    if (receiptDate > maxFutureDate) {
      throw new BadRequestException({
        code: 'INC003',
        message: 'Receipt date cannot exceed 24 months into the future.',
      });
    }

    // Flow 1: Recurring monthly income
    if (dto.isRecurring) {
      const dayOfMonth = receiptDate.getUTCDate();
      const rule = await this.incomeRecurrenceService.createRuleAndMaterialize({
        accountId,
        description: dto.description.trim(),
        amount: dto.amount,
        dayOfMonth,
        startDate: receiptDate,
        categoryId: dto.categoryId,
      });

      return {
        isRecurring: true,
        incomeRecurrenceRuleId: rule.id,
        description: rule.description,
        amount: Number(rule.amount),
        projectionsGenerated: 12,
      };
    }

    // Flow 2: Single income deposit
    const defaultStatus: IncomeStatus =
      receiptDate <= now ? IncomeStatus.RECEIVED : IncomeStatus.PENDING;

    const income = await this.prisma.income.create({
      data: {
        accountId,
        description: dto.description.trim(),
        amount: new Prisma.Decimal(dto.amount.toFixed(2)),
        receiptDate,
        status: dto.status || defaultStatus,
        categoryId: dto.categoryId,
        isRecurring: false,
        notes: dto.notes ? dto.notes.trim() : null,
      },
      include: {
        category: true,
      },
    });

    return income;
  }

  /**
   * Updates an existing income record.
   */
  async update(
    accountId: string,
    id: string,
    dto: UpdateIncomeDto,
  ): Promise<Income> {
    const income = await this.findById(accountId, id);

    const dataToUpdate: Prisma.IncomeUpdateInput = {};

    if (dto.description !== undefined) {
      dataToUpdate.description = dto.description.trim();
    }
    if (dto.amount !== undefined) {
      dataToUpdate.amount = new Prisma.Decimal(dto.amount.toFixed(2));
    }
    if (dto.receiptDate !== undefined) {
      const receiptDate = new Date(dto.receiptDate);
      const maxFutureDate = new Date();
      maxFutureDate.setUTCMonth(maxFutureDate.getUTCMonth() + 24);
      if (receiptDate > maxFutureDate) {
        throw new BadRequestException({
          code: 'INC003',
          message: 'Receipt date cannot exceed 24 months into the future.',
        });
      }
      dataToUpdate.receiptDate = receiptDate;
    }
    if (dto.categoryId !== undefined) {
      const category = await this.prisma.category.findFirst({
        where: { id: dto.categoryId, accountId },
      });
      if (!category) {
        throw new NotFoundException({
          code: 'INC004',
          message: 'Selected category not found in this account.',
        });
      }
      if (category.type !== CategoryType.INCOME) {
        throw new BadRequestException({
          code: 'INC005',
          message:
            'Selected category is not an income category (type must be INCOME).',
        });
      }
      dataToUpdate.category = { connect: { id: category.id } };
    }
    if (dto.status !== undefined) {
      dataToUpdate.status = dto.status;
    }
    if (dto.notes !== undefined) {
      dataToUpdate.notes = dto.notes ? dto.notes.trim() : null;
    }

    return this.prisma.income.update({
      where: { id: income.id },
      data: dataToUpdate,
      include: {
        category: true,
      },
    });
  }

  /**
   * Deletes an income record with granular scoping ('SINGLE' vs 'FUTURE').
   */
  async delete(
    accountId: string,
    id: string,
    scope: 'SINGLE' | 'FUTURE' = 'SINGLE',
  ): Promise<{ deletedCount: number }> {
    const income = await this.findById(accountId, id);

    if (scope === 'FUTURE' && income.incomeRecurrenceRuleId) {
      const deleteResult = await this.prisma.income.deleteMany({
        where: {
          accountId,
          incomeRecurrenceRuleId: income.incomeRecurrenceRuleId,
          receiptDate: {
            gte: income.receiptDate,
          },
        },
      });

      return { deletedCount: deleteResult.count };
    }

    await this.prisma.income.delete({
      where: { id: income.id },
    });

    return { deletedCount: 1 };
  }
}
