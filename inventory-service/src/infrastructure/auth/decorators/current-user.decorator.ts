import { createParamDecorator, ExecutionContext } from '@nestjs/common';

// eslint-disable-next-line @typescript-eslint/typedef
export const CurrentUser = createParamDecorator(
  (data: string | undefined, ctx: ExecutionContext): unknown => {
    const request: Record<string, unknown> = ctx.switchToHttp().getRequest();
    const user: Record<string, unknown> = request.user as Record<string, unknown>;

    return data ? user?.[data] : user;
  },
);
