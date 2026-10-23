import { Test, TestingModule } from '@nestjs/testing';
import { InvoicesService } from '../../src/modules/cards/invoices.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { Invoice, InvoiceStatus, Prisma } from '@prisma/client';

describe('InvoicesService', () => {
  let service: InvoicesService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      invoice: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        createMany: jest.fn(),
        update: jest.fn(),
      },
      creditCard: {
        findFirst: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InvoicesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<InvoicesService>(InvoicesService);
  });

  describe('serializeInvoice', () => {
    it('should dynamically return OVERDUE if invoice is not paid and current date is past due date', () => {
      const pastDueDate = new Date(Date.now() - 86400000 * 5); // 5 days ago
      const mockInvoice: Invoice = {
        id: 'inv-1',
        accountId: 'acc-1',
        cardId: 'card-1',
        billingMonth: 10,
        billingYear: 2026,
        closingDate: new Date(Date.now() - 86400000 * 12),
        dueDate: pastDueDate,
        totalAmount: new Prisma.Decimal('150.00'),
        status: InvoiceStatus.CLOSED,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = service.serializeInvoice(mockInvoice);
      expect(serialized.status).toBe('OVERDUE');
      expect(serialized.totalAmount).toBe(150.0);
    });

    it('should keep status as PAID even if due date is in the past', () => {
      const pastDueDate = new Date(Date.now() - 86400000 * 5);
      const mockInvoice: Invoice = {
        id: 'inv-2',
        accountId: 'acc-1',
        cardId: 'card-1',
        billingMonth: 10,
        billingYear: 2026,
        closingDate: new Date(Date.now() - 86400000 * 12),
        dueDate: pastDueDate,
        totalAmount: new Prisma.Decimal('150.00'),
        status: InvoiceStatus.PAID,
        paidAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = service.serializeInvoice(mockInvoice);
      expect(serialized.status).toBe(InvoiceStatus.PAID);
    });

    it('should keep status as OPEN if due date is in the future', () => {
      const futureDueDate = new Date(Date.now() + 86400000 * 10);
      const mockInvoice: Invoice = {
        id: 'inv-3',
        accountId: 'acc-1',
        cardId: 'card-1',
        billingMonth: 11,
        billingYear: 2026,
        closingDate: new Date(Date.now() + 86400000 * 3),
        dueDate: futureDueDate,
        totalAmount: new Prisma.Decimal('300.00'),
        status: InvoiceStatus.OPEN,
        paidAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const serialized = service.serializeInvoice(mockInvoice);
      expect(serialized.status).toBe(InvoiceStatus.OPEN);
    });
  });

  describe('calculateAvailableLimit', () => {
    it('should subtract the sum of unpaid invoices from the credit limit', () => {
      const creditLimit = 5000;
      const invoices = [
        {
          id: '1',
          totalAmount: new Prisma.Decimal('1000.00'),
          status: InvoiceStatus.CLOSED,
        },
        {
          id: '2',
          totalAmount: new Prisma.Decimal('500.50'),
          status: InvoiceStatus.OPEN,
        },
        {
          id: '3',
          totalAmount: new Prisma.Decimal('2000.00'),
          status: InvoiceStatus.PAID,
        },
      ] as Invoice[];

      const available = service.calculateAvailableLimit(creditLimit, invoices);
      // Unpaid = 1000 + 500.50 = 1500.50
      // Available = 5000 - 1500.50 = 3499.50
      expect(available).toBe(3499.5);
    });

    it('should return 0 when unpaid balance exceeds credit limit', () => {
      const creditLimit = 1000;
      const invoices = [
        {
          id: '1',
          totalAmount: new Prisma.Decimal('1500.00'),
          status: InvoiceStatus.OPEN,
        },
      ] as Invoice[];

      const available = service.calculateAvailableLimit(creditLimit, invoices);
      expect(available).toBe(0);
    });
  });

  describe('ensureCycleInvoices', () => {
    it('should create missing invoice cycles', async () => {
      prisma.invoice.findMany
        .mockResolvedValueOnce([]) // No existing invoices
        .mockResolvedValueOnce([
          {
            id: 'inv-new-1',
            cardId: 'c-1',
            billingYear: 2026,
            billingMonth: 10,
            closingDate: new Date(),
            dueDate: new Date(),
            totalAmount: new Prisma.Decimal('0.00'),
            status: InvoiceStatus.OPEN,
            paidAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ]);

      prisma.invoice.createMany.mockResolvedValue({ count: 14 });

      const result = await service.ensureCycleInvoices(
        'acc-1',
        'c-1',
        10,
        18,
        new Date(Date.UTC(2026, 9, 5)),
      );

      expect(prisma.invoice.createMany).toHaveBeenCalled();
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
