import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: number;
  type: 'member' | 'staff';
  role?: string;
  email?: string;
  /// Outlet the staff member is assigned to. NULL only when the staff is a
  /// super_admin (cross-outlet) or when type='member' (members aren't
  /// outlet-scoped). Required for outlet-scope enforcement (M-125).
  outlet_id?: number | null;
}

/// What lives on `req.user` after JWT validation. Consumers (services,
/// guards, decorators) should reach for `outletId` and `scopedOutletId`
/// — the latter is `null` for super_admin and the staff's outlet_id
/// otherwise, which is the value to pass into outlet-filtered queries.
export interface AuthenticatedUser {
  sub: number;
  type: 'member' | 'staff';
  role?: string;
  email?: string;
  outletId: number | null;
  /// `null` when the user has cross-outlet authority (super_admin or
  /// member). Otherwise the outlet_id to enforce as a filter.
  scopedOutletId: number | null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  validate(payload: JwtPayload): AuthenticatedUser {
    if (!payload.sub || !payload.type) {
      throw new UnauthorizedException('Invalid token payload');
    }

    const outletId = payload.outlet_id ?? null;
    // Super-admins and members aren't outlet-scoped.
    const scopedOutletId =
      payload.type === 'staff' && payload.role !== 'super_admin'
        ? outletId
        : null;

    return {
      sub: payload.sub,
      type: payload.type,
      role: payload.role,
      email: payload.email,
      outletId,
      scopedOutletId,
    };
  }
}
