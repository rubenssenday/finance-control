import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../modules/prisma/prisma.service';

@Injectable()
export class AccountContextGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.id) {
      throw new ForbiddenException('User is not authenticated.');
    }

    // Extract target account ID from X-Account-Id header, active_account_id cookie, or route param
    let accountId =
      (request.headers['x-account-id'] as string) ||
      (request.cookies ? request.cookies['active_account_id'] : null) ||
      request.params?.accountId ||
      request.params?.id;

    let membership = null;

    if (accountId) {
      membership = await this.prisma.accountMembership.findUnique({
        where: {
          uq_memberships_user_account: {
            accountId,
            userId: user.id,
          },
        },
        include: {
          account: true,
        },
      });

      if (!membership) {
        throw new ForbiddenException('You do not have access to this financial account.');
      }
    } else {
      // Fallback: pick user's first/primary membership
      membership = await this.prisma.accountMembership.findFirst({
        where: {
          userId: user.id,
        },
        include: {
          account: true,
        },
        orderBy: {
          createdAt: 'asc',
        },
      });

      if (!membership) {
        throw new NotFoundException('No active financial account found for user.');
      }
    }

    // Attach accountContext to request
    request.accountContext = {
      id: membership.account.id,
      name: membership.account.name,
      role: membership.role,
    };

    return true;
  }
}
