import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Role } from '@prisma/client';

export interface AccountContext {
  id: string;
  name: string;
  role: Role;
}

export const CurrentAccount = createParamDecorator(
  (data: keyof AccountContext | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const accountContext = request.accountContext as AccountContext;
    return data && accountContext ? accountContext[data] : accountContext;
  },
);
