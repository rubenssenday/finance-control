import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  Invoice,
  InvoiceStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client';
import {
  calculateCycleDates,
  resolveCycleForTransaction,
} from './utils/billing-cycle.util';
import { PayInvoiceDto } from './dto/pay-invoice.dto';
import { ReopenInvoiceDto } from './dto/reopen-invoice.dto';

export interface SerializedInvoice {
  id: string;
  cardId: string;
  billingMonth: number;
  billingYear: number;
  closingDate: Date;
  dueDate: Date;
  totalAmount: number;
  status: InvoiceStatus | 'OVERDUE';
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Serializes an invoice entity, dynamically computing the OVERDUE status
   * if the invoice is unpaid and the current system date has exceeded the due date.
   */
  serializeInvoice(invoice: Invoice): SerializedInvoice {
    const now = new Date();
    let displayStatus: InvoiceStatus | 'OVERDUE' = invoice.status;

    if (invoice.status !== InvoiceStatus.PAID && now > invoice.dueDate) {
      displayStatus = 'OVERDUE';
    }

    return {
      id: invoice.id,
      cardId: invoice.cardId,
      billingMonth: invoice.billingMonth,
      billingYear: invoice.billingYear,
      closingDate: invoice.closingDate,
      dueDate: invoice.dueDate,
      totalAmount: Number(invoice.totalAmount),
      status: displayStatus,
      paidAt: invoice.paidAt,
      createdAt: invoice.createdAt,
      updatedAt: invoice.updatedAt,
    };
  }

  /**
   * Ensures that invoices exist for the given card across a rolling window:
   * from 1 month in the past up to 12 months in the future.
   */
  async ensureCycleInvoices(
    accountId: string,
    cardId: string,
    closingDay: number,
    dueDay: number,
    referenceDate = new Date(),
  ): Promise<Invoice[]> {
    const currentCycle = resolveCycleForTransaction(referenceDate, closingDay);

    // Build cycles list: 1 month back, current, and next 12 months (14 cycles total)
    const cyclesToEnsure: Array<{ year: number; month: number }> = [];

    // 1 month back
    let prevMonth = currentCycle.billingMonth - 1;
    let prevYear = currentCycle.billingYear;
    if (prevMonth === 0) {
      prevMonth = 12;
      prevYear -= 1;
    }
    cyclesToEnsure.push({ year: prevYear, month: prevMonth });

    // Current and forward 12 months
    let iterYear = currentCycle.billingYear;
    let iterMonth = currentCycle.billingMonth;
    for (let i = 0; i <= 12; i++) {
      cyclesToEnsure.push({ year: iterYear, month: iterMonth });
      iterMonth++;
      if (iterMonth > 12) {
        iterMonth = 1;
        iterYear++;
      }
    }

    // Query existing invoices for these cycles
    const existingInvoices = await this.prisma.invoice.findMany({
      where: {
        cardId,
        OR: cyclesToEnsure.map((c) => ({
          billingYear: c.year,
          billingMonth: c.month,
        })),
      },
    });

    const existingMap = new Map<string, Invoice>();
    existingInvoices.forEach((inv) => {
      existingMap.set(`${inv.billingYear}-${inv.billingMonth}`, inv);
    });

    const now = new Date();
    const invoicesToCreate: Prisma.InvoiceCreateManyInput[] = [];

    for (const cycle of cyclesToEnsure) {
      const key = `${cycle.year}-${cycle.month}`;
      const existing = existingMap.get(key);

      if (!existing) {
        const dates = calculateCycleDates(
          cycle.year,
          cycle.month,
          closingDay,
          dueDay,
        );

        // If cycle has already closed in the past, status starts as CLOSED unless paid
        let initialStatus: InvoiceStatus = InvoiceStatus.OPEN;
        if (now > dates.closingDate) {
          initialStatus = InvoiceStatus.CLOSED;
        }

        invoicesToCreate.push({
          accountId,
          cardId,
          billingYear: cycle.year,
          billingMonth: cycle.month,
          closingDate: dates.closingDate,
          dueDate: dates.dueDate,
          totalAmount: new Prisma.Decimal('0.00'),
          status: initialStatus,
        });
      } else if (
        existing.status === InvoiceStatus.OPEN &&
        now > existing.closingDate
      ) {
        // Automatically transition past closingDate from OPEN to CLOSED
        await this.prisma.invoice.update({
          where: { id: existing.id },
          data: { status: InvoiceStatus.CLOSED },
        });
      }
    }

    if (invoicesToCreate.length > 0) {
      await this.prisma.invoice.createMany({
        data: invoicesToCreate,
        skipDuplicates: true,
      });
    }

    // Return the active set of invoices
    return this.prisma.invoice.findMany({
      where: { cardId },
      orderBy: [{ billingYear: 'asc' }, { billingMonth: 'asc' }],
    });
  }

  /**
   * Retrieves all invoices for a card, optionally filtered by billing year.
   */
  async getInvoicesForCard(
    accountId: string,
    cardId: string,
    year?: number,
  ): Promise<SerializedInvoice[]> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id: cardId, accountId },
    });

    if (!card) {
      return [];
    }

    await this.ensureCycleInvoices(
      accountId,
      cardId,
      card.closingDay,
      card.dueDay,
    );

    await this.syncOrphanedCardExpenses(
      accountId,
      cardId,
      card.closingDay,
      card.dueDay,
    );

    const whereClause: Prisma.InvoiceWhereInput = {
      cardId,
      accountId,
    };

    if (year) {
      whereClause.billingYear = year;
    }

    const invoices = await this.prisma.invoice.findMany({
      where: whereClause,
      orderBy: [{ billingYear: 'asc' }, { billingMonth: 'asc' }],
    });

    return invoices.map((inv) => this.serializeInvoice(inv));
  }

  /**
   * Syncs any credit card expenses for this card that are missing invoiceId,
   * associating them with the correct cycle invoice and incrementing invoice totals.
   */
  async syncOrphanedCardExpenses(
    accountId: string,
    cardId: string,
    closingDay: number,
    dueDay: number,
  ): Promise<number> {
    if (!this.prisma.expense?.findMany) {
      return 0;
    }

    const orphaned = await this.prisma.expense.findMany({
      where: {
        accountId,
        cardId,
        paymentMethod: PaymentMethod.CREDIT_CARD,
        invoiceId: null,
      },
    });

    if (orphaned.length === 0) return 0;

    for (const exp of orphaned) {
      const cycle = resolveCycleForTransaction(exp.transactionDate, closingDay);

      await this.ensureCycleInvoices(
        accountId,
        cardId,
        closingDay,
        dueDay,
        new Date(Date.UTC(cycle.billingYear, cycle.billingMonth - 1, 1)),
      );

      const targetInvoice = await this.prisma.invoice.findFirst({
        where: {
          cardId,
          billingYear: cycle.billingYear,
          billingMonth: cycle.billingMonth,
        },
      });

      if (targetInvoice) {
        await this.prisma.expense.update({
          where: { id: exp.id },
          data: {
            invoiceId: targetInvoice.id,
            dueDate: targetInvoice.dueDate,
          },
        });

        await this.prisma.invoice.update({
          where: { id: targetInvoice.id },
          data: {
            totalAmount: {
              increment: exp.amount,
            },
          },
        });
      }
    }

    return orphaned.length;
  }

  /**
   * Calculates the available credit limit based on card's limit minus
   * the sum of all unpaid invoices.
   */
  calculateAvailableLimit(creditLimit: number, invoices: Invoice[]): number {
    const unpaidSum = invoices
      .filter((inv) => inv.status !== InvoiceStatus.PAID)
      .reduce((sum, inv) => sum + Number(inv.totalAmount), 0);

    return Math.max(0, Math.round((creditLimit - unpaidSum) * 100) / 100);
  }

  /**
   * Returns the current active invoice for a card.
   */
  async getCurrentInvoice(
    accountId: string,
    cardId: string,
    closingDay: number,
    referenceDate = new Date(),
  ): Promise<SerializedInvoice | null> {
    const currentCycle = resolveCycleForTransaction(referenceDate, closingDay);

    const invoice = await this.prisma.invoice.findFirst({
      where: {
        cardId,
        billingYear: currentCycle.billingYear,
        billingMonth: currentCycle.billingMonth,
      },
    });

    return invoice ? this.serializeInvoice(invoice) : null;
  }

  /**
   * Atomically marks a credit card invoice as PAID and cascades PAID status
   * to all underlying expense installments attached to that invoice.
   */
  async payInvoice(
    accountId: string,
    invoiceId: string,
    dto: PayInvoiceDto = {},
  ): Promise<{ invoice: SerializedInvoice; settledExpensesCount: number }> {
    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, accountId },
      include: { card: true },
    });

    if (!invoice) {
      throw new NotFoundException({
        code: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found in this account.',
      });
    }

    if (invoice.status === InvoiceStatus.PAID) {
      throw new BadRequestException({
        code: 'INVOICE_ALREADY_PAID',
        message: 'Invoice is already marked as PAID.',
      });
    }

    // Optimistic concurrency check
    if (dto.expectedUpdatedAt) {
      const expectedTime = new Date(dto.expectedUpdatedAt).getTime();
      const actualTime = new Date(invoice.updatedAt).getTime();
      if (Math.abs(expectedTime - actualTime) > 1000) {
        throw new ConflictException({
          code: 'CONCURRENT_STATUS_MUTATION',
          message:
            'Invoice status was updated in another session. Refreshed latest data.',
          currentData: this.serializeInvoice(invoice),
        });
      }
    }

    const paymentDate = dto.paymentDate ? new Date(dto.paymentDate) : new Date();

    return this.prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: InvoiceStatus.PAID,
          paidAt: paymentDate,
        },
      });

      const expenseUpdateResult = await tx.expense.updateMany({
        where: {
          invoiceId: invoice.id,
          accountId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: paymentDate,
        },
      });

      return {
        invoice: this.serializeInvoice(updatedInvoice),
        settledExpensesCount: expenseUpdateResult.count,
      };
    });
  }

  /**
   * Atomically reopens a paid credit card invoice and reverts all underlying
   * expense installments back to PENDING status.
   */
  async reopenInvoice(
    accountId: string,
    invoiceId: string,
    dto: ReopenInvoiceDto,
  ): Promise<{ invoice: SerializedInvoice; revertedExpensesCount: number }> {
    if (!dto.confirmReopen) {
      throw new BadRequestException({
        code: 'CONFIRMATION_REQUIRED',
        message: 'User confirmation is required to reopen an invoice.',
      });
    }

    const invoice = await this.prisma.invoice.findFirst({
      where: { id: invoiceId, accountId },
      include: { card: true },
    });

    if (!invoice) {
      throw new NotFoundException({
        code: 'INVOICE_NOT_FOUND',
        message: 'Invoice not found in this account.',
      });
    }

    if (invoice.status !== InvoiceStatus.PAID) {
      throw new BadRequestException({
        code: 'INVOICE_NOT_PAID',
        message: 'Invoice is not currently in PAID status.',
      });
    }

    // Optimistic concurrency check
    if (dto.expectedUpdatedAt) {
      const expectedTime = new Date(dto.expectedUpdatedAt).getTime();
      const actualTime = new Date(invoice.updatedAt).getTime();
      if (Math.abs(expectedTime - actualTime) > 1000) {
        throw new ConflictException({
          code: 'CONCURRENT_STATUS_MUTATION',
          message:
            'Invoice status was updated in another session. Refreshed latest data.',
          currentData: this.serializeInvoice(invoice),
        });
      }
    }

    // Determine target status based on current date vs closing date
    const now = new Date();
    const targetStatus =
      now > invoice.closingDate ? InvoiceStatus.CLOSED : InvoiceStatus.OPEN;

    return this.prisma.$transaction(async (tx) => {
      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: targetStatus,
          paidAt: null,
        },
      });

      const expenseUpdateResult = await tx.expense.updateMany({
        where: {
          invoiceId: invoice.id,
          accountId,
        },
        data: {
          paymentStatus: PaymentStatus.PENDING,
          paidAt: null,
        },
      });

      return {
        invoice: this.serializeInvoice(updatedInvoice),
        revertedExpensesCount: expenseUpdateResult.count,
      };
    });
  }
}
