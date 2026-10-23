import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';
import {
  calculateCycleDates,
  resolveCycleForTransaction,
} from './utils/billing-cycle.util';

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
}
