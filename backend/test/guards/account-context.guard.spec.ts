import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AccountContextGuard } from '../../src/common/guards/account-context.guard';
import { PrismaService } from '../../src/modules/prisma/prisma.service';
import { Role } from '@prisma/client';

describe('AccountContextGuard', () => {
  let guard: AccountContextGuard;
  let prismaMock: any;

  beforeEach(() => {
    prismaMock = {
      accountMembership: {
        findUnique: jest.fn(),
        findFirst: jest.fn(),
      },
    };
    guard = new AccountContextGuard(prismaMock as unknown as PrismaService);
  });

  const createMockContext = (requestData: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => requestData,
      }),
    } as unknown as ExecutionContext;
  };

  it('should throw ForbiddenException if user is not authenticated', async () => {
    const ctx = createMockContext({ user: null });
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });

  it('should attach accountContext when valid X-Account-Id header is passed', async () => {
    const user = { id: 'user-uuid-1', email: 'test@example.com' };
    const accountId = 'account-uuid-123';

    prismaMock.accountMembership.findUnique.mockResolvedValue({
      id: 'membership-uuid',
      accountId,
      userId: user.id,
      role: Role.ADMINISTRATOR,
      account: {
        id: accountId,
        name: "Test's Account",
      },
    });

    const req: any = {
      user,
      headers: { 'x-account-id': accountId },
      cookies: {},
    };

    const ctx = createMockContext(req);
    const result = await guard.canActivate(ctx);

    expect(result).toBe(true);
    expect(req.accountContext).toEqual({
      id: accountId,
      name: "Test's Account",
      role: Role.ADMINISTRATOR,
    });
  });

  it('should throw ForbiddenException if user is not a member of the requested account', async () => {
    const user = { id: 'user-uuid-1', email: 'test@example.com' };
    const accountId = 'unauthorized-account-uuid';

    prismaMock.accountMembership.findUnique.mockResolvedValue(null);

    const req: any = {
      user,
      headers: { 'x-account-id': accountId },
      cookies: {},
    };

    const ctx = createMockContext(req);
    await expect(guard.canActivate(ctx)).rejects.toThrow(ForbiddenException);
  });
});
