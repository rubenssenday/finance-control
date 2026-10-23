import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { InvoicesService, SerializedInvoice } from './invoices.service';
import { CreateCardDto } from './dto/create-card.dto';
import { UpdateCardDto } from './dto/update-card.dto';
import { CardBrand, Prisma } from '@prisma/client';

export interface SerializedCard {
  id: string;
  accountId: string;
  nickname: string;
  brand: CardBrand;
  creditLimit: number;
  closingDay: number;
  dueDay: number;
  isArchived: boolean;
  availableLimit: number;
  currentInvoice: SerializedInvoice | null;
  createdAt: Date;
  updatedAt: Date;
}

@Injectable()
export class CardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly invoicesService: InvoicesService,
  ) {}

  /**
   * Lists all credit cards for the active account.
   */
  async list(
    accountId: string,
    includeArchived = false,
  ): Promise<SerializedCard[]> {
    const where: Prisma.CreditCardWhereInput = { accountId };
    if (!includeArchived) {
      where.isArchived = false;
    }

    const cards = await this.prisma.creditCard.findMany({
      where,
      orderBy: [{ isArchived: 'asc' }, { nickname: 'asc' }],
    });

    const serializedCards: SerializedCard[] = [];

    for (const card of cards) {
      // Ensure current rolling invoices exist
      const invoices = await this.invoicesService.ensureCycleInvoices(
        accountId,
        card.id,
        card.closingDay,
        card.dueDay,
      );

      const availableLimit = this.invoicesService.calculateAvailableLimit(
        Number(card.creditLimit),
        invoices,
      );

      const currentInvoice = await this.invoicesService.getCurrentInvoice(
        accountId,
        card.id,
        card.closingDay,
      );

      serializedCards.push({
        id: card.id,
        accountId: card.accountId,
        nickname: card.nickname,
        brand: card.brand,
        creditLimit: Number(card.creditLimit),
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        isArchived: card.isArchived,
        availableLimit,
        currentInvoice,
        createdAt: card.createdAt,
        updatedAt: card.updatedAt,
      });
    }

    return serializedCards;
  }

  /**
   * Retrieves a single card by ID with available limit and current invoice.
   */
  async findById(accountId: string, id: string): Promise<SerializedCard> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, accountId },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD006',
        message: 'Credit card not found in this account.',
      });
    }

    const invoices = await this.invoicesService.ensureCycleInvoices(
      accountId,
      card.id,
      card.closingDay,
      card.dueDay,
    );

    const availableLimit = this.invoicesService.calculateAvailableLimit(
      Number(card.creditLimit),
      invoices,
    );

    const currentInvoice = await this.invoicesService.getCurrentInvoice(
      accountId,
      card.id,
      card.closingDay,
    );

    return {
      id: card.id,
      accountId: card.accountId,
      nickname: card.nickname,
      brand: card.brand,
      creditLimit: Number(card.creditLimit),
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      isArchived: card.isArchived,
      availableLimit,
      currentInvoice,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }

  /**
   * Creates a new credit card and provisions initial invoice cycles.
   */
  async create(accountId: string, dto: CreateCardDto): Promise<SerializedCard> {
    const trimmedNickname = dto.nickname.trim();

    // Check unique nickname within account
    const existing = await this.prisma.creditCard.findFirst({
      where: {
        accountId,
        nickname: { equals: trimmedNickname, mode: 'insensitive' },
      },
    });

    if (existing) {
      throw new ConflictException({
        code: 'CARD004',
        message: 'A credit card with this nickname already exists in this account.',
      });
    }

    if (dto.closingDay === dto.dueDay) {
      throw new BadRequestException({
        code: 'CARD002',
        message:
          'Closing day and due day cannot be the same day. Invoices require at least 1 day between statement close and payment due date.',
      });
    }

    const card = await this.prisma.creditCard.create({
      data: {
        accountId,
        nickname: trimmedNickname,
        brand: dto.brand,
        creditLimit: new Prisma.Decimal(dto.creditLimit.toFixed(2)),
        closingDay: dto.closingDay,
        dueDay: dto.dueDay,
      },
    });

    // Provision rolling invoices for the new card
    const invoices = await this.invoicesService.ensureCycleInvoices(
      accountId,
      card.id,
      card.closingDay,
      card.dueDay,
    );

    const currentInvoice = await this.invoicesService.getCurrentInvoice(
      accountId,
      card.id,
      card.closingDay,
    );

    return {
      id: card.id,
      accountId: card.accountId,
      nickname: card.nickname,
      brand: card.brand,
      creditLimit: Number(card.creditLimit),
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      isArchived: card.isArchived,
      availableLimit: Number(card.creditLimit),
      currentInvoice,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }

  /**
   * Updates card details, credit limit, or archive status.
   */
  async update(
    accountId: string,
    id: string,
    dto: UpdateCardDto,
  ): Promise<SerializedCard> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, accountId },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD006',
        message: 'Credit card not found in this account.',
      });
    }

    const dataToUpdate: Prisma.CreditCardUpdateInput = {};

    if (dto.nickname) {
      const trimmedNickname = dto.nickname.trim();
      if (trimmedNickname.toLowerCase() !== card.nickname.toLowerCase()) {
        const existing = await this.prisma.creditCard.findFirst({
          where: {
            accountId,
            nickname: { equals: trimmedNickname, mode: 'insensitive' },
          },
        });

        if (existing) {
          throw new ConflictException({
            code: 'CARD004',
            message:
              'A credit card with this nickname already exists in this account.',
          });
        }
      }
      dataToUpdate.nickname = trimmedNickname;
    }

    if (dto.brand) {
      dataToUpdate.brand = dto.brand;
    }

    if (dto.creditLimit !== undefined) {
      dataToUpdate.creditLimit = new Prisma.Decimal(
        dto.creditLimit.toFixed(2),
      );
    }

    const targetClosingDay =
      dto.closingDay !== undefined ? dto.closingDay : card.closingDay;
    const targetDueDay =
      dto.dueDay !== undefined ? dto.dueDay : card.dueDay;

    if (targetClosingDay === targetDueDay) {
      throw new BadRequestException({
        code: 'CARD002',
        message:
          'Closing day and due day cannot be the same day. Invoices require at least 1 day between statement close and payment due date.',
      });
    }

    if (dto.closingDay !== undefined) {
      dataToUpdate.closingDay = dto.closingDay;
    }
    if (dto.dueDay !== undefined) {
      dataToUpdate.dueDay = dto.dueDay;
    }
    if (dto.isArchived !== undefined) {
      dataToUpdate.isArchived = dto.isArchived;
    }

    const updatedCard = await this.prisma.creditCard.update({
      where: { id },
      data: dataToUpdate,
    });

    // Re-verify cycle invoices if closing or due day changed
    const invoices = await this.invoicesService.ensureCycleInvoices(
      accountId,
      updatedCard.id,
      updatedCard.closingDay,
      updatedCard.dueDay,
    );

    const availableLimit = this.invoicesService.calculateAvailableLimit(
      Number(updatedCard.creditLimit),
      invoices,
    );

    const currentInvoice = await this.invoicesService.getCurrentInvoice(
      accountId,
      updatedCard.id,
      updatedCard.closingDay,
    );

    return {
      id: updatedCard.id,
      accountId: updatedCard.accountId,
      nickname: updatedCard.nickname,
      brand: updatedCard.brand,
      creditLimit: Number(updatedCard.creditLimit),
      closingDay: updatedCard.closingDay,
      dueDay: updatedCard.dueDay,
      isArchived: updatedCard.isArchived,
      availableLimit,
      currentInvoice,
      createdAt: updatedCard.createdAt,
      updatedAt: updatedCard.updatedAt,
    };
  }

  /**
   * Deletes a credit card if it has zero unsettled balances and no attached transactions.
   */
  async delete(accountId: string, id: string): Promise<void> {
    const card = await this.prisma.creditCard.findFirst({
      where: { id, accountId },
      include: {
        invoices: true,
      },
    });

    if (!card) {
      throw new NotFoundException({
        code: 'CARD006',
        message: 'Credit card not found in this account.',
      });
    }

    // Check if card has any invoice with totalAmount > 0
    const hasUnsettledBalances = card.invoices.some(
      (inv) => Number(inv.totalAmount) > 0,
    );

    if (hasUnsettledBalances) {
      throw new BadRequestException({
        code: 'CARD003',
        message:
          'Cannot delete card with unsettled invoices or active future installments. Please archive the card or settle obligations first.',
      });
    }

    await this.prisma.creditCard.delete({
      where: { id },
    });
  }
}
