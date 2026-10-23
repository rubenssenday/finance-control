import { IsEnum, IsOptional, IsDateString } from 'class-validator';
import { PaymentStatus } from '@prisma/client';

export class SettleExpenseDto {
  @IsOptional()
  @IsEnum(PaymentStatus, {
    message: 'Payment status must be one of: PENDING, PAID.',
  })
  status?: PaymentStatus;

  @IsOptional()
  @IsDateString(
    {},
    { message: 'Settlement date must be a valid ISO 8601 date string.' },
  )
  settlementDate?: string;

  @IsOptional()
  @IsDateString(
    {},
    {
      message:
        'Expected updated timestamp must be a valid ISO 8601 date string.',
    },
  )
  expectedUpdatedAt?: string;
}
