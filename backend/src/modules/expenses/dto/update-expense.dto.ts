import {
  IsString,
  IsEnum,
  IsNumber,
  IsUUID,
  IsOptional,
  IsDateString,
  Min,
  Max,
  Length,
  IsIn,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class UpdateExpenseDto {
  @IsOptional()
  @IsString()
  @Length(3, 100, {
    message: 'Description must be between 3 and 100 characters.',
  })
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a valid currency value.' },
  )
  @Min(0.01, { message: 'Amount must be at least R$ 0.01.' })
  @Max(999999.99, { message: 'Amount cannot exceed R$ 999,999.99.' })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Transaction date must be a valid ISO 8601 date string.' })
  transactionDate?: string;

  @IsOptional()
  @IsEnum(PaymentMethod, {
    message: 'Payment method must be one of: CREDIT_CARD, DEBIT_CARD, BOLETO, PIX.',
  })
  paymentMethod?: PaymentMethod;

  @IsOptional()
  @IsEnum(PaymentStatus, {
    message: 'Payment status must be one of: PENDING, PAID.',
  })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID.' })
  categoryId?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Card ID must be a valid UUID.' })
  cardId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO 8601 date string.' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'Notes cannot exceed 255 characters.' })
  notes?: string;

  @IsOptional()
  @IsIn(['SINGLE', 'FUTURE'], {
    message: "Scope must be either 'SINGLE' or 'FUTURE'.",
  })
  scope?: 'SINGLE' | 'FUTURE';
}
