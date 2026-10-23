import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  RecurrenceRule,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import { clampDay } from '../cards/utils/billing-cycle.util';

export interface CreateRecurrenceParams {
  accountId: string;
  description: string;
  amount: number;
  dayOfMonth: number;
  startDate: Date;
  endDate?: Date | null;
  paymentMethod: PaymentMethod;
  categoryId: string;
  cardId?: string | null;
}

@Injectable()
export class RecurrenceService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Creates a recurring monthly template and materializes the next 12 forward monthly expenses.
   */
  async createRuleAndMaterialize(
    params: CreateRecurrenceParams,
  ): Promise<RecurrenceRule> {
    const rule = await this.prisma.recurrenceRule.create({
      data: {
        accountId: params.accountId,
        description: params.description,
        amount: new Prisma.Decimal(params.amount.toFixed(2)),
        dayOfMonth: params.dayOfMonth,
        startDate: params.startDate,
        endDate: params.endDate || null,
        paymentMethod: params.paymentMethod,
        categoryId: params.categoryId,
        cardId: params.cardId || null,
      },
    });

    // Materialize 12 monthly instances
    await this.materializeProjections(rule, 12);

    return rule;
  }

  /**
   * Materializes monthly expense instances for a recurrence rule for N forward months.
   */
  async materializeProjections(
    rule: RecurrenceRule,
    monthsCount = 12,
  ): Promise<number> {
    const startYear = rule.startDate.getUTCFullYear();
    const startMonth = rule.startDate.getUTCMonth() + 1;

    let curYear = startYear;
    let curMonth = startMonth;

    const expensesToCreate: Prisma.ExpenseCreateManyInput[] = [];

    for (let i = 0; i < monthsCount; i++) {
      const validDay = clampDay(curYear, curMonth, rule.dayOfMonth);
      const targetDate = new Date(Date.UTC(curYear, curMonth - 1, validDay, 12, 0, 0));

      // If beyond endDate, stop materializing
      if (rule.endDate && targetDate > rule.endDate) {
        break;
      }

      // Check if already materialized for this date/rule
      expensesToCreate.push({
        accountId: rule.accountId,
        description: rule.description,
        amount: rule.amount,
        transactionDate: targetDate,
        dueDate: targetDate,
        paymentMethod: rule.paymentMethod,
        paymentStatus: PaymentStatus.PENDING,
        categoryId: rule.categoryId,
        cardId: rule.cardId,
        isRecurring: true,
        recurrenceRuleId: rule.id,
      });

      curMonth++;
      if (curMonth > 12) {
        curMonth = 1;
        curYear++;
      }
    }

    if (expensesToCreate.length > 0) {
      await this.prisma.expense.createMany({
        data: expensesToCreate,
      });
    }

    return expensesToCreate.length;
  }

  /**
   * Deletes a recurrence rule and optionally all future materialized expenses.
   */
  async deleteRule(
    accountId: string,
    ruleId: string,
    deleteFutureExpenses = true,
    fromDate = new Date(),
  ): Promise<void> {
    if (deleteFutureExpenses) {
      await this.prisma.expense.deleteMany({
        where: {
          accountId,
          recurrenceRuleId: ruleId,
          dueDate: { gte: fromDate },
          paymentStatus: PaymentStatus.PENDING,
        },
      });
    }

    await this.prisma.recurrenceRule.delete({
      where: { id: ruleId },
    });
  }
}
