import {
  IsString,
  IsOptional,
  Length,
  Matches,
  IsIn,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CURATED_ICONS } from '../constants/curated-icons';

export class UpdateCategoryDto {
  @IsOptional()
  @IsString()
  @Length(2, 40, { message: 'Category name must be between 2 and 40 characters.' })
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  name?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, {
    message: 'Color must be a valid 6-character hexadecimal code (e.g. #FF6B6B).',
  })
  color?: string;

  @IsOptional()
  @IsString()
  @IsIn(CURATED_ICONS, {
    message: 'Icon must be one of the 30 curated financial and lifestyle icons.',
  })
  icon?: string;
}
