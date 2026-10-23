import {
  IsArray,
  ValidateNested,
  IsString,
  IsNumber,
  IsEnum,
  IsUUID,
  IsOptional,
  IsDateString,
  IsInt,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentMethod } from '@prisma/client';

export class CsvConfirmRowDto {
  @IsString()
  @Length(3, 100)
  description: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  @Max(999999.99)
  amount: number;

  @IsDateString()
  transactionDate: string;

  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @IsUUID('4')
  categoryId: string;

  @IsOptional()
  @IsUUID('4')
  cardId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(72)
  installments?: number;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class ConfirmCsvImportDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CsvConfirmRowDto)
  rows: CsvConfirmRowDto[];
}
