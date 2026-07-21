import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const NegocioId = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number => {
    return ctx.switchToHttp().getRequest().user.negocioId;
  },
);
