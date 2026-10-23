import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IncomeRecurrenceRule, IncomeStatus, Prisma } from '@prisma/client';
import { clampDay } from '../cards/utils/billing-cycle.util';

export interface CreateIncomeRecurrenceParams {
  accountId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  startDate: Date;
  endDate?: Date | null;
  categoryId: string;
}

@Injectable()
export class IncomeRecurrenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a recurring income rule and materializes the next 12 rolling monthly projections.
   */
  async createRuleAndMaterialize(
    params: CreateIncomeRecurrenceParams,
  ): Promise<IncomeRecurrenceRule> {
    const rule = await this.prisma.incomeRecurrenceRule.create({
      data: {
        accountId: params.accountId,
        description: params.description,
        amount: new Prisma.Decimal(params.amount.toFixed(2)),
        dayOfMonth: params.dayOfMonth,
        startDate: params.startDate,
        endDate: params.endDate || null,
        categoryId: params.categoryId,
      },
    });

    // Materialize 12 rolling forward projections
    await this.materializeProjections(rule, 12);

    return rule;
  }

  /**
   * Materializes monthly income instances for a recurrence rule across N forward months.
   */
  async materializeProjections(
    rule: IncomeRecurrenceRule,
    monthsCount = 12,
  ): Promise<number> {
    const startYear = rule.startDate.getUTCFullYear();
    const startMonth = rule.startDate.getUTCMonth() + 1;

    let curYear = startYear;
    let curMonth = startMonth;

    const now = new Date();
    const incomesToCreate: Prisma.IncomeCreateManyInput[] = [];

    for (let i = 0; i < monthsCount; i++) {
      const validDay = clampDay(curYear, curMonth, rule.dayOfMonth);
      const targetDate = new Date(
        Date.UTC(curYear, curMonth - 1, validDay, 12, 0, 0),
      );

      // If beyond endDate, stop materializing
      if (rule.endDate && targetDate > rule.endDate) {
        break;
      }

      // Default status: RECEIVED for today/past, PENDING for future dates
      const defaultStatus: IncomeStatus =
        targetDate <= now ? IncomeStatus.RECEIVED : IncomeStatus.PENDING;

      incomesToCreate.push({
        accountId: rule.accountId,
        description: rule.description,
        amount: rule.amount,
        receiptDate: targetDate,
        status: defaultStatus,
        categoryId: rule.categoryId,
        isRecurring: true,
        incomeRecurrenceRuleId: rule.id,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    if (incomesToCreate.length > 0) {
      await this.prisma.income.createMany({
        data: incomesToCreate,
      });
    }

    return incomesToCreate.length;
  }
}
