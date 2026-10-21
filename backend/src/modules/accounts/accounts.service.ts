import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { InviteMemberDto } from './dto/invite-member.dto';
import { UpdateMemberRoleDto } from './dto/update-member-role.dto';
import { Role, InvitationStatus } from '@prisma/client';

@Injectable()
export class AccountsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * List all accounts the user is a member of
   */
  async getUserAccounts(userId: string) {
    const memberships = await this.prisma.accountMembership.findMany({
      where: { userId },
      include: {
        account: {
          include: {
            memberships: {
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return memberships.map((m) => ({
      id: m.account.id,
      name: m.account.name,
      role: m.role,
      memberCount: m.account.memberships.length,
    }));
  }

  /**
   * Validate and switch active account
   */
  async switchAccount(userId: string, accountId: string) {
    const membership = await this.prisma.accountMembership.findUnique({
      where: {
        uq_memberships_user_account: {
          accountId,
          userId,
        },
      },
      include: { account: true },
    });

    if (!membership) {
      throw new ForbiddenException({
        code: 'ACCOUNT_FORBIDDEN',
        message: 'You do not have access to this financial account.',
      });
    }

    return {
      id: membership.account.id,
      name: membership.account.name,
      role: membership.role,
    };
  }

  /**
   * List all members of an account
   */
  async getAccountMembers(accountId: string) {
    const memberships = await this.prisma.accountMembership.findMany({
      where: { accountId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            displayName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    const invitations = await this.prisma.accountInvitation.findMany({
      where: {
        accountId,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      members: memberships.map((m) => ({
        id: m.id,
        userId: m.user.id,
        email: m.user.email,
        displayName: m.user.displayName,
        avatarUrl: m.user.avatarUrl,
        role: m.role,
        joinedAt: m.createdAt,
      })),
      pendingInvitations: invitations.map((inv) => ({
        id: inv.id,
        email: inv.email,
        role: inv.role,
        expiresAt: inv.expiresAt,
        createdAt: inv.createdAt,
      })),
    };
  }

  /**
   * Invite a member to the account
   */
  async inviteMember(accountId: string, dto: InviteMemberDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    // Check if user is already a member
    const existingMember = await this.prisma.accountMembership.findFirst({
      where: {
        accountId,
        user: { email: normalizedEmail },
      },
    });

    if (existingMember) {
      throw new ConflictException({
        code: 'INVITE_ALREADY_MEMBER',
        message: 'This email address is already a member of this account.',
      });
    }

    // Check if there is an active pending invitation
    const existingInvite = await this.prisma.accountInvitation.findFirst({
      where: {
        accountId,
        email: normalizedEmail,
        status: InvitationStatus.PENDING,
        expiresAt: { gt: new Date() },
      },
    });

    if (existingInvite) {
      throw new ConflictException({
        code: 'INVITE_PENDING_EXISTS',
        message: 'A pending invitation already exists for this email address.',
      });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // If user already exists in the system, add membership directly
    const registeredUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (registeredUser) {
      const membership = await this.prisma.accountMembership.create({
        data: {
          accountId,
          userId: registeredUser.id,
          role: dto.role,
        },
      });

      return {
        id: membership.id,
        accountId,
        email: normalizedEmail,
        role: dto.role,
        status: 'ACCEPTED',
        message: 'User was already registered; access granted immediately.',
      };
    }

    // If user not registered yet, create pending invitation
    const invitation = await this.prisma.accountInvitation.create({
      data: {
        accountId,
        email: normalizedEmail,
        role: dto.role,
        status: InvitationStatus.PENDING,
        token,
        expiresAt,
      },
    });

    return {
      id: invitation.id,
      accountId: invitation.accountId,
      email: invitation.email,
      role: invitation.role,
      status: invitation.status,
    };
  }

  /**
   * Update a member's role
   */
  async updateMemberRole(
    accountId: string,
    targetUserId: string,
    dto: UpdateMemberRoleDto,
    actingUserId: string,
  ) {
    const targetMembership = await this.prisma.accountMembership.findUnique({
      where: {
        uq_memberships_user_account: {
          accountId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found in this account.',
      });
    }

    // Prevent demoting the sole administrator
    if (targetMembership.role === Role.ADMINISTRATOR && dto.role !== Role.ADMINISTRATOR) {
      const adminCount = await this.prisma.accountMembership.count({
        where: { accountId, role: Role.ADMINISTRATOR },
      });

      if (adminCount <= 1) {
        throw new BadRequestException({
          code: 'MEMBER_SOLE_ADMIN',
          message:
            'You cannot demote the sole administrator of an account. Promote another member first.',
        });
      }
    }

    const updated = await this.prisma.accountMembership.update({
      where: { id: targetMembership.id },
      data: { role: dto.role },
    });

    return {
      id: updated.id,
      accountId: updated.accountId,
      userId: updated.userId,
      role: updated.role,
    };
  }

  /**
   * Remove a member or revoke access
   */
  async removeMember(accountId: string, targetUserId: string, actingUserId: string) {
    const targetMembership = await this.prisma.accountMembership.findUnique({
      where: {
        uq_memberships_user_account: {
          accountId,
          userId: targetUserId,
        },
      },
    });

    if (!targetMembership) {
      throw new NotFoundException({
        code: 'MEMBER_NOT_FOUND',
        message: 'Member not found in this account.',
      });
    }

    // Prevent removing the sole administrator
    if (targetMembership.role === Role.ADMINISTRATOR) {
      const adminCount = await this.prisma.accountMembership.count({
        where: { accountId, role: Role.ADMINISTRATOR },
      });

      if (adminCount <= 1) {
        throw new BadRequestException({
          code: 'MEMBER_SOLE_ADMIN',
          message:
            'You cannot remove the sole administrator of an account. Promote another member first.',
        });
      }
    }

    await this.prisma.accountMembership.delete({
      where: { id: targetMembership.id },
    });

    return {
      message: 'Member removed successfully.',
    };
  }
}
