import { IsBoolean, Equals, IsOptional, IsDateString } from 'class-validator';

export class ReopenInvoiceDto {
  @IsBoolean({ message: 'confirmReopen must be a boolean value.' })
  @Equals(true, {
    message: 'Explicit confirmation (confirmReopen: true) is required to reopen an invoice.',
  })
  confirmReopen: boolean;

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
