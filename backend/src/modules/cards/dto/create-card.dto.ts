import {
  IsString,
  IsEnum,
  IsNumber,
  IsInt,
  Min,
  Max,
  Length,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';
import { Type } from 'class-transformer';
import { CardBrand } from '@prisma/client';

@ValidatorConstraint({ name: 'isNotEqualToClosingDay', async: false })
export class IsNotEqualToClosingDayConstraint
  implements ValidatorConstraintInterface
{
  validate(dueDay: number, args: ValidationArguments) {
    const object = args.object as any;
    return object.closingDay !== dueDay;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Closing day and due day cannot be the same day. Invoices require at least 1 day between statement close and payment due date.';
  }
}

export class CreateCardDto {
  @IsString()
  @Length(2, 30, {
    message: 'Card nickname must be between 2 and 30 characters.',
  })
  nickname: string;

  @IsEnum(CardBrand, {
    message: 'Card network brand must be one of: VISA, MASTERCARD, ELO, AMEX, HIPERCARD.',
  })
  brand: CardBrand;

  @Type(() => Number)
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Credit limit must be a valid numeric currency amount.' },
  )
  @Min(100.0, { message: 'Credit limit must be at least R$ 100.00.' })
  @Max(1000000.0, { message: 'Credit limit cannot exceed R$ 1,000,000.00.' })
  creditLimit: number;

  @Type(() => Number)
  @IsInt({ message: 'Closing day must be an integer between 1 and 31.' })
  @Min(1, { message: 'Closing day must be between 1 and 31.' })
  @Max(31, { message: 'Closing day must be between 1 and 31.' })
  closingDay: number;

  @Type(() => Number)
  @IsInt({ message: 'Due day must be an integer between 1 and 31.' })
  @Min(1, { message: 'Due day must be between 1 and 31.' })
  @Max(31, { message: 'Due day must be between 1 and 31.' })
  @Validate(IsNotEqualToClosingDayConstraint)
  dueDay: number;
}
