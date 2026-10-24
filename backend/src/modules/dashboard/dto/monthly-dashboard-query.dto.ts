import { IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthlyDashboardQueryDto {
  @Type(() => Number)
  @IsInt({ message: 'Year must be an integer.' })
  @Min(2000, { message: 'Year must be at least 2000.' })
  @Max(2100, { message: 'Year must not exceed 2100.' })
  year: number;

  @Type(() => Number)
  @IsInt({ message: 'Month must be an integer.' })
  @Min(1, { message: 'Month must be between 1 and 12.' })
  @Max(12, { message: 'Month must be between 1 and 12.' })
  month: number;
}
