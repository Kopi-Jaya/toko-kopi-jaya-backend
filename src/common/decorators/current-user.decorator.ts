import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../../auth/jwt.strategy';

/// Pulls the authenticated user (as shaped by [JwtStrategy.validate]) off
/// the request. Type-safe — controllers get `AuthenticatedUser`, not `any`.
///
/// Usage:
/// ```ts
/// @Get()
/// findAll(@CurrentUser() user: AuthenticatedUser) {
///   return this.svc.findAll(user.scopedOutletId);
/// }
/// ```
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<Request>();
    return request.user as unknown as AuthenticatedUser;
  },
);
