import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { PasswordService } from './password.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Role, InvitationStatus } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwordService: PasswordService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Register a new user with email and password
   */
  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException({
        code: 'AUTH_EMAIL_EXISTS',
        message: 'An account with this email address already exists.',
      });
    }

    const passwordHash = await this.passwordService.hash(dto.password);

    // Atomically create User, Default Account, Admin Membership, and auto-claim pending invitations
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: normalizedEmail,
          passwordHash,
          displayName: dto.displayName.trim(),
        },
      });

      const account = await tx.account.create({
        data: {
          name: `${user.displayName}'s Account`,
        },
      });

      await tx.accountMembership.create({
        data: {
          accountId: account.id,
          userId: user.id,
          role: Role.ADMINISTRATOR,
        },
      });

      // Claim pending invitations for this email
      const pendingInvitations = await tx.accountInvitation.findMany({
        where: {
          email: normalizedEmail,
          status: InvitationStatus.PENDING,
          expiresAt: { gt: new Date() },
        },
      });

      for (const invite of pendingInvitations) {
        await tx.accountMembership.create({
          data: {
            accountId: invite.accountId,
            userId: user.id,
            role: invite.role,
          },
        });

        await tx.accountInvitation.update({
          where: { id: invite.id },
          data: { status: InvitationStatus.ACCEPTED },
        });
      }

      return { user, account };
    });

    const tokens = await this.generateTokens(result.user.id, result.user.email);

    return {
      tokens,
      user: {
        id: result.user.id,
        email: result.user.email,
        displayName: result.user.displayName,
        avatarUrl: result.user.avatarUrl,
      },
      activeAccount: {
        id: result.account.id,
        name: result.account.name,
        role: Role.ADMINISTRATOR,
      },
    };
  }

  /**
   * Authenticate user with email and password
   */
  async login(dto: LoginDto) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: {
        memberships: {
          include: { account: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user || !user.passwordHash) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const isValidPassword = await this.passwordService.verify(user.passwordHash, dto.password);
    if (!isValidPassword) {
      throw new UnauthorizedException({
        code: 'AUTH_INVALID_CREDENTIALS',
        message: 'Invalid email or password.',
      });
    }

    const tokens = await this.generateTokens(user.id, user.email);

    const primaryMembership = user.memberships[0] || null;

    return {
      tokens,
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
      },
      activeAccount: primaryMembership
        ? {
            id: primaryMembership.account.id,
            name: primaryMembership.account.name,
            role: primaryMembership.role,
          }
        : null,
    };
  }

  /**
   * Handle Google OAuth user profile callback
   */
  async loginWithGoogle(profile: {
    googleId: string;
    email: string;
    displayName: string;
    avatarUrl?: string;
  }) {
    const normalizedEmail = profile.email.toLowerCase().trim();

    let user = await this.prisma.user.findFirst({
      where: {
        OR: [{ googleId: profile.googleId }, { email: normalizedEmail }],
      },
      include: {
        memberships: {
          include: { account: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!user) {
      // New user via Google: create User, Account, Membership, and claim pending invites
      const created = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email: normalizedEmail,
            googleId: profile.googleId,
            displayName: profile.displayName,
            avatarUrl: profile.avatarUrl,
          },
        });

        const account = await tx.account.create({
          data: {
            name: `${newUser.displayName}'s Account`,
          },
        });

        await tx.accountMembership.create({
          data: {
            accountId: account.id,
            userId: newUser.id,
            role: Role.ADMINISTRATOR,
          },
        });

        // Claim pending invitations
        const pendingInvitations = await tx.accountInvitation.findMany({
          where: {
            email: normalizedEmail,
            status: InvitationStatus.PENDING,
            expiresAt: { gt: new Date() },
          },
        });

        for (const invite of pendingInvitations) {
          await tx.accountMembership.create({
            data: {
              accountId: invite.accountId,
              userId: newUser.id,
              role: invite.role,
            },
          });

          await tx.accountInvitation.update({
            where: { id: invite.id },
            data: { status: InvitationStatus.ACCEPTED },
          });
        }

        return { user: newUser, account };
      });

      const tokens = await this.generateTokens(created.user.id, created.user.email);
      return {
        tokens,
        user: created.user,
        activeAccount: {
          id: created.account.id,
          name: created.account.name,
          role: Role.ADMINISTRATOR,
        },
      };
    } else {
      // Link Google ID if not yet linked
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            googleId: profile.googleId,
            avatarUrl: profile.avatarUrl || user.avatarUrl,
          },
          include: {
            memberships: {
              include: { account: true },
              orderBy: { createdAt: 'asc' },
            },
          },
        });
      }

      const tokens = await this.generateTokens(user.id, user.email);
      const primaryMembership = user.memberships[0] || null;

      return {
        tokens,
        user: {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
        activeAccount: primaryMembership
          ? {
              id: primaryMembership.account.id,
              name: primaryMembership.account.name,
              role: primaryMembership.role,
            }
          : null,
      };
    }
  }

  /**
   * Refresh token rotation
   */
  async refreshTokens(refreshToken: string) {
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const tokenHash = this.hashToken(refreshToken);

    const tokenRecord = await this.prisma.refreshToken.findFirst({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    // Reuse detection: if revoked token is used, revoke all tokens for this user
    if (tokenRecord.revokedAt) {
      await this.prisma.refreshToken.updateMany({
        where: { userId: tokenRecord.userId },
        data: { revokedAt: new Date() },
      });
      throw new UnauthorizedException('Compromised refresh token detected. Please sign in again.');
    }

    if (new Date() > tokenRecord.expiresAt) {
      throw new UnauthorizedException('Refresh token has expired.');
    }

    // Revoke old token and issue new token pair
    await this.prisma.refreshToken.update({
      where: { id: tokenRecord.id },
      data: { revokedAt: new Date() },
    });

    const tokens = await this.generateTokens(tokenRecord.userId, tokenRecord.user.email);
    return tokens;
  }

  /**
   * Revoke refresh token on logout
   */
  async logout(refreshToken?: string) {
    if (refreshToken) {
      const tokenHash = this.hashToken(refreshToken);
      await this.prisma.refreshToken.updateMany({
        where: { tokenHash },
        data: { revokedAt: new Date() },
      });
    }
    return { message: 'Logged out successfully.' };
  }

  /**
   * Generate access token and database-persisted refresh token
   */
  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };

    const accessToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_ACCESS_SECRET || 'fallback_jwt_access_secret_key',
      expiresIn: '15m',
    });

    const rawRefreshToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = this.hashToken(rawRefreshToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: rawRefreshToken,
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}
