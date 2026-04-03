import { Response, NextFunction } from 'express';
import { Role } from '../types/enums';
import { AuthRequest } from './auth';
import { fail } from '../utils/response';

export function authorize(...roles: Role[]) {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      fail(res, 'Authentication required', 401);
      return;
    }
    if (!roles.includes(req.user.role)) {
      fail(res, `Access denied. Requires: ${roles.join(' or ')}`, 403);
      return;
    }
    next();
  };
}

export const adminOnly      = authorize(Role.ADMIN);
export const analystOrAdmin = authorize(Role.ANALYST, Role.ADMIN);
export const allRoles       = authorize(Role.VIEWER, Role.ANALYST, Role.ADMIN);
