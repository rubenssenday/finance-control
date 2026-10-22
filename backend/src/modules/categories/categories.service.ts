import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CategoryType, Prisma } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { DEFAULT_SYSTEM_CATEGORIES } from './constants/curated-icons';

export interface CategoryWithMeta {
  id: string;
  accountId: string;
  name: string;
  type: CategoryType;
  color: string;
  icon: string;
  isDefault: boolean;
  transactionCount: number;
  canDelete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CategoriesService {
  private readonly logger = new Logger(CategoriesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Seed the 8 default system categories for an account workspace.
   */
  async seedDefaultCategories(
    accountId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<void> {
    const client = tx || this.prisma;

    const existingCount = await client.category.count({
      where: { accountId, isDefault: true },
    });

    if (existingCount > 0) {
      return;
    }

    const defaultRecords = DEFAULT_SYSTEM_CATEGORIES.map((cat) => ({
      accountId,
      name: cat.name,
      color: cat.color,
      icon: cat.icon,
      type: cat.type,
      isDefault: true,
    }));

    await client.category.createMany({
      data: defaultRecords,
      skipDuplicates: true,
    });

    this.logger.log(`Seeded 8 default categories for account ${accountId}`);
  }

  /**
   * List all categories for the active account workspace.
   * Optionally filter by CategoryType (EXPENSE | INCOME).
   */
  async list(accountId: string, type?: CategoryType): Promise<CategoryWithMeta[]> {
    // If account has zero categories, seed the defaults automatically
    const totalCount = await this.prisma.category.count({
      where: { accountId },
    });
    if (totalCount === 0) {
      await this.seedDefaultCategories(accountId);
    }

    const whereClause: Prisma.CategoryWhereInput = {
      accountId,
      ...(type ? { type } : {}),
    };

    const categories = await this.prisma.category.findMany({
      where: whereClause,
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });

    return categories.map((cat) => {
      const transactionCount = 0; // Linked dynamically in F04 / F05
      return {
        ...cat,
        transactionCount,
        canDelete: !cat.isDefault && transactionCount === 0,
      };
    });
  }

  /**
   * Retrieve a single category by ID within the active account workspace.
   */
  async findById(accountId: string, id: string): Promise<CategoryWithMeta> {
    const category = await this.prisma.category.findFirst({
      where: { id, accountId },
    });

    if (!category) {
      throw new NotFoundException({
        code: 'CAT006',
        message: 'Category not found in this workspace.',
      });
    }

    const transactionCount = 0;
    return {
      ...category,
      transactionCount,
      canDelete: !category.isDefault && transactionCount === 0,
    };
  }

  /**
   * Create a new custom category within the active account workspace.
   * Enforces a maximum of 50 custom categories per account.
   */
  async create(
    accountId: string,
    dto: CreateCategoryDto,
  ): Promise<CategoryWithMeta> {
    // 1. Enforce quota: Max 50 custom categories per account
    const customCount = await this.prisma.category.count({
      where: { accountId, isDefault: false },
    });

    if (customCount >= 50) {
      throw new BadRequestException({
        code: 'CAT002',
        message:
          'Maximum quota of 50 custom categories reached for this workspace.',
      });
    }

    // 2. Check for duplicate name within account
    const duplicate = await this.prisma.category.findFirst({
      where: {
        accountId,
        name: { equals: dto.name, mode: 'insensitive' },
      },
    });

    if (duplicate) {
      throw new ConflictException({
        code: 'CAT003',
        message: 'A category with this name already exists in this workspace.',
      });
    }

    // 3. Create category
    const created = await this.prisma.category.create({
      data: {
        accountId,
        name: dto.name,
        type: dto.type,
        color: dto.color.toUpperCase(),
        icon: dto.icon,
        isDefault: false,
      },
    });

    return {
      ...created,
      transactionCount: 0,
      canDelete: true,
    };
  }

  /**
   * Update category name, color, or icon.
   * Both custom and system default categories may be updated.
   */
  async update(
    accountId: string,
    id: string,
    dto: UpdateCategoryDto,
  ): Promise<CategoryWithMeta> {
    const category = await this.findById(accountId, id);

    // If name is changing, ensure no conflict within the account
    if (dto.name && dto.name.toLowerCase() !== category.name.toLowerCase()) {
      const duplicate = await this.prisma.category.findFirst({
        where: {
          accountId,
          name: { equals: dto.name, mode: 'insensitive' },
          id: { not: id },
        },
      });

      if (duplicate) {
        throw new ConflictException({
          code: 'CAT003',
          message:
            'A category with this name already exists in this workspace.',
        });
      }
    }

    const updated = await this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name ? { name: dto.name } : {}),
        ...(dto.color ? { color: dto.color.toUpperCase() } : {}),
        ...(dto.icon ? { icon: dto.icon } : {}),
      },
    });

    return {
      ...updated,
      transactionCount: category.transactionCount,
      canDelete: category.canDelete,
    };
  }

  /**
   * Delete a custom category.
   * System default categories and categories with transactions cannot be deleted.
   */
  async delete(accountId: string, id: string): Promise<void> {
    const category = await this.findById(accountId, id);

    if (category.isDefault) {
      throw new ForbiddenException({
        code: 'CAT005',
        message: 'System default categories cannot be deleted.',
      });
    }

    if (category.transactionCount > 0) {
      throw new BadRequestException({
        code: 'CAT004',
        message:
          'Category cannot be deleted because it is referenced by active transactions. Reassign or delete transactions first.',
      });
    }

    await this.prisma.category.delete({
      where: { id },
    });
  }
}
