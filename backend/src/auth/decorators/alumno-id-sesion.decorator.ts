import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const AlumnoIdSesion = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): number | null => {
    return ctx.switchToHttp().getRequest().user.alumnoId ?? null;
  },
);
