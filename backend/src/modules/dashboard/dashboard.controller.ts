import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { MonthlyDashboardQueryDto } from './dto/monthly-dashboard-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountContextGuard } from '../../common/guards/account-context.guard';
import { CurrentAccount } from '../../common/decorators/current-account.decorator';

@Controller('dashboard')
@UseGuards(JwtAuthGuard, AccountContextGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('monthly')
  async getMonthlyAnalytics(
    @CurrentAccount('id') accountId: string,
    @Query() query: MonthlyDashboardQueryDto,
  ) {
    const data = await this.dashboardService.getMonthlyAnalytics(
      accountId,
      query.year,
      query.month,
    );

    return {
      status: 'success',
      data,
    };
  }
}
