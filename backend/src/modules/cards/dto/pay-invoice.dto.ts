import { IsOptional, IsDateString } from 'class-validator';

export class PayInvoiceDto {
  @IsOptional()
  @IsDateString(
    {},
    { message: 'Payment date must be a valid ISO 8601 date string.' },
  )
  paymentDate?: string;

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
