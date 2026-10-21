import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  Res,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { AccountsService } from './accounts.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AccountContextGuard } from '../../common/guards/account-context.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Get()
  async getUserAccounts(@CurrentUser() user: AuthenticatedUser) {
    const data = await this.accountsService.getUserAccounts(user.id);
    return {
      status: 'success',
      data,
    };
  }

  @Post(':id/switch')
  @HttpCode(HttpStatus.OK)
  async switchAccount(
    @Param('id') accountId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const activeAccount = await this.accountsService.switchAccount(user.id, accountId);

    const isProduction = process.env.NODE_ENV === 'production';
    res.cookie('active_account_id', activeAccount.id, {
      httpOnly: false, // Accessible to client for active header synchronization
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    return {
      status: 'success',
      data: { activeAccount },
    };
  }

  @Get(':id/members')
  @UseGuards(AccountContextGuard)
  async getAccountMembers(@Param('id') accountId: string) {
    const data = await this.accountsService.getAccountMembers(accountId);
    return {
      status: 'success',
      data,
    };
  }

  @Post(':id/invitations')
  @UseGuards(AccountContextGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  async inviteMember(
    @Param('id') accountId: string,
    @Body() dto: InviteMemberDto,
  ) {
    const data = await this.accountsService.inviteMember(accountId, dto);
    return {
      status: 'success',
      data,
    };
  }

  @Patch(':id/members/:userId')
  @UseGuards(AccountContextGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  async updateMemberRole(
    @Param('id') accountId: string,
    @Param('userId') targetUserId: string,
    @Body() dto: UpdateMemberRoleDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.accountsService.updateMemberRole(
      accountId,
      targetUserId,
      dto,
      user.id,
    );
    return {
      status: 'success',
      data,
    };
  }

  @Delete(':id/members/:userId')
  @UseGuards(AccountContextGuard, RolesGuard)
  @Roles(Role.ADMINISTRATOR)
  async removeMember(
    @Param('id') accountId: string,
    @Param('userId') targetUserId: string,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    const data = await this.accountsService.removeMember(
      accountId,
      targetUserId,
      user.id,
    );
    return {
      status: 'success',
      data,
    };
  }
}
