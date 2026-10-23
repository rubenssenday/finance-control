import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from '../../src/modules/cards/invoices.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { InvoiceStatus, PaymentStatus } from '@prisma/client';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';

describe('InvoicesService - Invoice Settlement & Reopening', () => {
  let service: InvoicesService;
  let prisma: any;

  const accountId = 'acc-123';
  const invoiceId = 'inv-123';
  const cardId = 'card-123';

  beforeEach(async () => {
    prisma = {
      invoice: {
        findFirst: jest.fn(),
        update: jest.fn(),
      },
      expense: {
        updateMany: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('payInvoice', () => {
    it('should atomically mark invoice as PAID and cascade PAID to all linked expenses', async () => {
      const existingInvoice = {
        id: invoiceId,
        accountId,
        cardId,
        billingMonth: 10,
        billingYear: 2026,
        closingDate: new Date('2026-10-18T00:00:00.000Z'),
        dueDate: new Date('2026-10-25T00:00:00.000Z'),
        totalAmount: 1200.5,
        status: InvoiceStatus.CLOSED,
        paidAt: null,
        updatedAt: new Date('2026-10-20T10:00:00.000Z'),
        createdAt: new Date(),
      };
      prisma.invoice.findFirst.mockResolvedValue(existingInvoice);
      prisma.invoice.update.mockImplementation(({ data }: any) => ({
        ...existingInvoice,
        status: data.status,
        paidAt: data.paidAt,
      }));
      prisma.expense.updateMany.mockResolvedValue({ count: 5 });

      const result = await service.payInvoice(accountId, invoiceId, {
        paymentDate: '2026-10-25T14:00:00.000Z',
      });

      expect(result.invoice.status).toBe(InvoiceStatus.PAID);
      expect(result.invoice.paidAt).toEqual(new Date('2026-10-25T14:00:00.000Z'));
      expect(result.settledExpensesCount).toBe(5);
      expect(prisma.expense.updateMany).toHaveBeenCalledWith({
        where: {
          invoiceId,
          accountId,
        },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paidAt: new Date('2026-10-25T14:00:00.000Z'),
        },
      });
    });

    it('should throw BadRequestException if invoice is already PAID', async () => {
      const existingInvoice = {
        id: invoiceId,
        accountId,
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
      };
      prisma.invoice.findFirst.mockResolvedValue(existingInvoice);

      await expect(
        service.payInvoice(accountId, invoiceId, {}),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException (409) when invoice expectedUpdatedAt does not match', async () => {
      const existingInvoice = {
        id: invoiceId,
        accountId,
        status: InvoiceStatus.CLOSED,
        updatedAt: new Date('2026-10-23T10:00:00.000Z'),
      };
      prisma.invoice.findFirst.mockResolvedValue(existingInvoice);

      await expect(
        service.payInvoice(accountId, invoiceId, {
          expectedUpdatedAt: '2026-10-22T08:00:00.000Z',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if invoice does not exist', async () => {
      prisma.invoice.findFirst.mockResolvedValue(null);

      await expect(
        service.payInvoice(accountId, 'non-existent', {}),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('reopenInvoice', () => {
    it('should require confirmReopen: true', async () => {
      await expect(
        service.reopenInvoice(accountId, invoiceId, { confirmReopen: false }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should atomically revert invoice to CLOSED (if past closing) and expenses to PENDING', async () => {
      const existingInvoice = {
        id: invoiceId,
        accountId,
        cardId,
        billingMonth: 10,
        billingYear: 2026,
        closingDate: new Date('2020-01-01T00:00:00.000Z'), // definitely in the past
        dueDate: new Date('2099-01-10T00:00:00.000Z'), // future due date so status remains CLOSED
        totalAmount: 500.0,
        status: InvoiceStatus.PAID,
        paidAt: new Date('2026-10-20T10:00:00.000Z'),
        updatedAt: new Date('2026-10-20T10:00:00.000Z'),
        createdAt: new Date(),
      };
      prisma.invoice.findFirst.mockResolvedValue(existingInvoice);
      prisma.invoice.update.mockImplementation(({ data }: any) => ({
        ...existingInvoice,
        status: data.status,
        paidAt: data.paidAt,
      }));
      prisma.expense.updateMany.mockResolvedValue({ count: 3 });

      const result = await service.reopenInvoice(accountId, invoiceId, {
        confirmReopen: true,
      });

      expect(result.invoice.status).toBe(InvoiceStatus.CLOSED);
      expect(result.invoice.paidAt).toBeNull();
      expect(result.revertedExpensesCount).toBe(3);
      expect(prisma.expense.updateMany).toHaveBeenCalledWith({
        where: {
          invoiceId,
          accountId,
        },
        data: {
          paymentStatus: PaymentStatus.PENDING,
          paidAt: null,
        },
      });
    });

    it('should throw BadRequestException if invoice is not currently PAID', async () => {
      const openInvoice = {
        id: invoiceId,
        accountId,
        status: InvoiceStatus.OPEN,
      };
      prisma.invoice.findFirst.mockResolvedValue(openInvoice);

      await expect(
        service.reopenInvoice(accountId, invoiceId, { confirmReopen: true }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
