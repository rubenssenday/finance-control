import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsUUID,
  IsBoolean,
  IsOptional,
  IsDateString,
  Min,
  Max,
  Length,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod, PaymentStatus } from '@prisma/client';

export class CreateExpenseDto {
  @IsString()
  @Length(3, 100, {
    message: 'Description must be between 3 and 100 characters.',
  })
  description: string;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a valid currency value.' },
  )
  @Min(0.01, { message: 'Amount must be at least R$ 0.01.' })
  @Max(999999.99, { message: 'Amount cannot exceed R$ 999,999.99.' })
  amount: number;

  @IsDateString({}, { message: 'Transaction date must be a valid ISO 8601 date string.' })
  transactionDate: string;

  @IsEnum(PaymentMethod, {
    message: 'Payment method must be one of: CREDIT_CARD, DEBIT_CARD, BOLETO, PIX.',
  })
  paymentMethod: PaymentMethod;

  @IsUUID('4', { message: 'Category ID must be a valid UUID.' })
  categoryId: string;

  @ValidateIf((o) => o.paymentMethod === PaymentMethod.CREDIT_CARD)
  @IsUUID('4', {
    message: 'Credit card payment method requires a valid cardId belonging to this account.',
  })
  cardId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Installments count must be an integer.' })
  @Min(1, { message: 'Installment count must be at least 1.' })
  @Max(72, { message: 'Installment count cannot exceed 72.' })
  installments?: number;

  @IsOptional()
  @IsBoolean()
  isRecurring?: boolean;

  @IsOptional()
  @IsEnum(PaymentStatus, {
    message: 'Payment status must be one of: PENDING, PAID.',
  })
  paymentStatus?: PaymentStatus;

  @IsOptional()
  @IsDateString({}, { message: 'Due date must be a valid ISO 8601 date string.' })
  dueDate?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255, { message: 'Notes cannot exceed 255 characters.' })
  notes?: string;
}
