import {
  IsString,
  IsNotEmpty,
  Length,
  Matches,
  IsIn,
  IsEnum,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CategoryType } from '@prisma/client';
import { CURATED_ICONS } from '../constants/curated-icons';

export class CreateCategoryDto {
  @IsString()
  @IsNotEmpty()
  @Length(2, 40, { message: 'Category name must be between 2 and 40 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name: string;

  @IsEnum(CategoryType, {
    message: 'Category type must be either EXPENSE or INCOME.',
  })
  type: CategoryType;

  @IsString()
  @IsNotEmpty()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid 6-character hexadecimal code (e.g. #FF6B6B).',
  })
  color: string;

  @IsString()
  @IsNotEmpty()
  @IsIn(CURATED_ICONS, {
    message: 'Icon must be one of the 30 curated financial and lifestyle icons.',
  })
  icon: string;
}
