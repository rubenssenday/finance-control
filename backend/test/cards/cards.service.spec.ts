import { Test, TestingModule } from '@nestjs/testing';
import { CardsService } from '../../src/modules/cards/cards.service';
import { InvoicesService } from '../../src/modules/cards/invoices.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { CardBrand, Prisma } from '@prisma/client';

describe('CardsService', () => {
  let service: CardsService;
  let prisma: any;
  let invoicesService: any;

  beforeEach(async () => {
    prisma = {
      creditCard: {
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    invoicesService = {
      ensureCycleInvoices: jest.fn().mockResolvedValue([]),
      calculateAvailableLimit: jest.fn().mockReturnValue(5000),
      getCurrentInvoice: jest.fn().mockResolvedValue(null),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CardsService,
        { provide: PrismaService, useValue: prisma },
        { provide: InvoicesService, useValue: invoicesService },
      ],
    }).compile();

    service = module.get<CardsService>(CardsService);
  });

  describe('create', () => {
    it('should create a card successfully when parameters are valid', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);
      prisma.creditCard.create.mockResolvedValue({
        id: 'card-1',
        accountId: 'acc-1',
        nickname: 'Nubank Platinum',
        brand: CardBrand.MASTERCARD,
        creditLimit: new Prisma.Decimal('5000.00'),
        closingDay: 5,
        dueDay: 12,
        isArchived: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create('acc-1', {
        nickname: 'Nubank Platinum',
        brand: CardBrand.MASTERCARD,
        creditLimit: 5000,
        closingDay: 5,
        dueDay: 12,
      });

      expect(result.id).toBe('card-1');
      expect(result.nickname).toBe('Nubank Platinum');
      expect(result.brand).toBe(CardBrand.MASTERCARD);
      expect(result.creditLimit).toBe(5000);
      expect(invoicesService.ensureCycleInvoices).toHaveBeenCalled();
    });

    it('should throw ConflictException (CARD004) if nickname already exists in the same account', async () => {
      prisma.creditCard.findFirst.mockResolvedValue({ id: 'existing-card' });

      await expect(
        service.create('acc-1', {
          nickname: 'Nubank Platinum',
          brand: CardBrand.MASTERCARD,
          creditLimit: 5000,
          closingDay: 5,
          dueDay: 12,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException (CARD002) if closingDay equals dueDay', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(
        service.create('acc-1', {
          nickname: 'Nubank Platinum',
          brand: CardBrand.MASTERCARD,
          creditLimit: 5000,
          closingDay: 10,
          dueDay: 10,
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should throw BadRequestException (CARD003) if card has unsettled invoices with totalAmount > 0', async () => {
      prisma.creditCard.findFirst.mockResolvedValue({
        id: 'card-1',
        accountId: 'acc-1',
        invoices: [
          {
            id: 'inv-1',
            totalAmount: new Prisma.Decimal('250.00'),
          },
        ],
      });

      await expect(service.delete('acc-1', 'card-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should successfully delete card if all invoices have totalAmount of 0.00', async () => {
      prisma.creditCard.findFirst.mockResolvedValue({
        id: 'card-1',
        accountId: 'acc-1',
        invoices: [
          {
            id: 'inv-1',
            totalAmount: new Prisma.Decimal('0.00'),
          },
        ],
      });
      prisma.creditCard.delete.mockResolvedValue({ id: 'card-1' });

      await service.delete('acc-1', 'card-1');
      expect(prisma.creditCard.delete).toHaveBeenCalledWith({
        where: { id: 'card-1' },
      });
    });

    it('should throw NotFoundException if card does not exist in account', async () => {
      prisma.creditCard.findFirst.mockResolvedValue(null);

      await expect(service.delete('acc-1', 'card-non-existent')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update card details and archive flag', async () => {
      prisma.creditCard.findFirst
        .mockResolvedValueOnce({
          id: 'card-1',
          accountId: 'acc-1',
          nickname: 'Nubank',
          closingDay: 5,
          dueDay: 12,
        })
        .mockResolvedValueOnce(null); // No nickname conflict

      prisma.creditCard.update.mockResolvedValue({
        id: 'card-1',
        accountId: 'acc-1',
        nickname: 'Nubank Black',
        brand: CardBrand.MASTERCARD,
        creditLimit: new Prisma.Decimal('10000.00'),
        closingDay: 5,
        dueDay: 12,
        isArchived: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.update('acc-1', 'card-1', {
        nickname: 'Nubank Black',
        isArchived: true,
      });

      expect(result.nickname).toBe('Nubank Black');
      expect(result.isArchived).toBe(true);
    });
  });
});
