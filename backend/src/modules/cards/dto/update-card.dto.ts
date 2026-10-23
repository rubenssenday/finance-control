import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  IsBoolean,
  IsOptional,
  Min,
  Max,
  Length,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CardBrand } from '@prisma/client';

export class UpdateCardDto {
  @IsOptional()
  @IsString()
  @Length(2, 30, {
    message: 'Card nickname must be between 2 and 30 characters.',
  })
  nickname?: string;

  @IsOptional()
  @IsEnum(CardBrand, {
    message: 'Card network brand must be one of: VISA, MASTERCARD, ELO, AMEX, HIPERCARD.',
  })
  brand?: CardBrand;

  @IsOptional()
  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Credit limit must be a valid numeric currency amount.' },
  )
  @Min(100.0, { message: 'Credit limit must be at least R$ 100.00.' })
  @Max(1000000.0, { message: 'Credit limit cannot exceed R$ 1,000,000.00.' })
  creditLimit?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Closing day must be an integer between 1 and 31.' })
  @Min(1, { message: 'Closing day must be between 1 and 31.' })
  @Max(31, { message: 'Closing day must be between 1 and 31.' })
  closingDay?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Due day must be an integer between 1 and 31.' })
  @Min(1, { message: 'Due day must be between 1 and 31.' })
  @Max(31, { message: 'Due day must be between 1 and 31.' })
  dueDay?: number;

  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}
