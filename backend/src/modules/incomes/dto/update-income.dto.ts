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
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { IncomeStatus } from '@prisma/client';

export class UpdateIncomeDto {
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
    { message: 'Amount must be a valid currency value with at most 2 decimal places.' },
  )
  @Min(0.01, { message: 'Income amount must be greater than zero.' })
  @Max(999999.99, { message: 'Amount cannot exceed R$ 999,999.99.' })
  amount?: number;

  @IsOptional()
  @IsDateString({}, { message: 'Receipt date must be a valid ISO 8601 date string.' })
  receiptDate?: string;

  @IsOptional()
  @IsUUID('4', { message: 'Category ID must be a valid UUID.' })
  categoryId?: string;

  @IsOptional()
  @IsEnum(IncomeStatus, {
    message: 'Status must be one of: RECEIVED, PENDING.',
  })
  status?: IncomeStatus;

  @IsOptional()
  @IsString()
  @MaxLength(500, { message: 'Notes cannot exceed 500 characters.' })
  notes?: string;
}
