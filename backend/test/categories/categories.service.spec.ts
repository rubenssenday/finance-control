import { Test, TestingModule } from '@nestjs/testing';
import { CategoriesService } from '../../src/modules/categories/categories.service';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { BadRequestException, ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CategoryType } from '@prisma/client';

describe('CategoriesService', () => {
  let service: CategoriesService;
  let prisma: any;

  const mockAccountId = '11111111-1111-1111-1111-111111111111';

  beforeEach(async () => {
    prisma = {
      category: {
        count: jest.fn(),
        createMany: jest.fn(),
        findMany: jest.fn(),
        findFirst: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CategoriesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<CategoriesService>(CategoriesService);
  });

  describe('seedDefaultCategories', () => {
    it('should seed 8 default categories if none exist', async () => {
      prisma.category.count.mockResolvedValue(0);
      prisma.category.createMany.mockResolvedValue({ count: 8 });

      await service.seedDefaultCategories(mockAccountId);

      expect(prisma.category.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({ name: 'Food & Dining', isDefault: true, type: 'EXPENSE' }),
          expect.objectContaining({ name: 'Income & Salary', isDefault: true, type: 'INCOME' }),
        ]),
        skipDuplicates: true,
      });
    });

    it('should skip seeding if defaults already exist', async () => {
      prisma.category.count.mockResolvedValue(8);

      await service.seedDefaultCategories(mockAccountId);

      expect(prisma.category.createMany).not.toHaveBeenCalled();
    });
  });

  describe('list', () => {
    it('should return categories with computed transactionCount and canDelete flag', async () => {
      prisma.category.count.mockResolvedValue(2);
      prisma.category.findMany.mockResolvedValue([
        {
          id: 'cat-1',
          accountId: mockAccountId,
          name: 'Food & Dining',
          type: CategoryType.EXPENSE,
          color: '#FF6B6B',
          icon: 'utensils',
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'cat-2',
          accountId: mockAccountId,
          name: 'Pet Care',
          type: CategoryType.EXPENSE,
          color: '#9D4EDD',
          icon: 'paw-print',
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ]);

      const result = await service.list(mockAccountId);

      expect(result).toHaveLength(2);
      expect(result[0].canDelete).toBe(false); // isDefault = true
      expect(result[1].canDelete).toBe(true);  // isDefault = false, transactionCount = 0
    });
  });

  describe('create', () => {
    it('should successfully create a custom category', async () => {
      prisma.category.count.mockResolvedValue(5);
      prisma.category.findFirst.mockResolvedValue(null);
      prisma.category.create.mockResolvedValue({
        id: 'cat-new',
        accountId: mockAccountId,
        name: 'Streaming Services',
        type: CategoryType.EXPENSE,
        color: '#4D96FF',
        icon: 'tv',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await service.create(mockAccountId, {
        name: 'Streaming Services',
        type: CategoryType.EXPENSE,
        color: '#4d96ff',
        icon: 'tv',
      });

      expect(result.id).toBe('cat-new');
      expect(result.isDefault).toBe(false);
      expect(result.canDelete).toBe(true);
      expect(result.color).toBe('#4D96FF');
    });

    it('should reject creation when custom quota of 50 is reached (CAT002)', async () => {
      prisma.category.count.mockResolvedValue(50);

      await expect(
        service.create(mockAccountId, {
          name: '51st Category',
          type: CategoryType.EXPENSE,
          color: '#FF9234',
          icon: 'film',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject creation with duplicate name within account (CAT003)', async () => {
      prisma.category.count.mockResolvedValue(5);
      prisma.category.findFirst.mockResolvedValue({ id: 'existing-id', name: 'Food & Dining' });

      await expect(
        service.create(mockAccountId, {
          name: 'Food & Dining',
          type: CategoryType.EXPENSE,
          color: '#FF6B6B',
          icon: 'utensils',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    it('should update category attributes successfully', async () => {
      prisma.category.findFirst.mockResolvedValueOnce({
        id: 'cat-1',
        accountId: mockAccountId,
        name: 'Food',
        isDefault: false,
      });
      prisma.category.update.mockResolvedValue({
        id: 'cat-1',
        accountId: mockAccountId,
        name: 'Food & Groceries',
        color: '#FF6B6B',
        icon: 'shopping-cart',
        isDefault: false,
      });

      const result = await service.update(mockAccountId, 'cat-1', {
        name: 'Food & Groceries',
        icon: 'shopping-cart',
      });

      expect(result.name).toBe('Food & Groceries');
    });

    it('should throw NotFoundException if category does not exist in account (CAT006)', async () => {
      prisma.category.findFirst.mockResolvedValue(null);

      await expect(
        service.update(mockAccountId, 'non-existent', { name: 'New Name' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('should delete unused custom category successfully', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-custom',
        accountId: mockAccountId,
        name: 'Custom',
        isDefault: false,
      });
      prisma.category.delete.mockResolvedValue({});

      await expect(service.delete(mockAccountId, 'cat-custom')).resolves.toBeUndefined();
      expect(prisma.category.delete).toHaveBeenCalledWith({ where: { id: 'cat-custom' } });
    });

    it('should prevent deletion of system default category (CAT005)', async () => {
      prisma.category.findFirst.mockResolvedValue({
        id: 'cat-default',
        accountId: mockAccountId,
        name: 'Food & Dining',
        isDefault: true,
      });

      await expect(service.delete(mockAccountId, 'cat-default')).rejects.toThrow(ForbiddenException);
    });
  });
});
