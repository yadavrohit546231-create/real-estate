import { Response, NextFunction } from 'express';
import { UserRole } from '@real-estate/types';
import { AuthenticatedRequest } from './auth';
import { sendError } from '../utils/response';

export function requireRoles(...allowedRoles: UserRole[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401);
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      sendError(
        res,
        `Forbidden: Role '${req.user.role}' is not authorized to perform this action`,
        403
      );
      return;
    }

    next();
  };
}

export const requireAdmin = requireRoles(UserRole.SUPER_ADMIN);
export const requirePlatformManager = requireRoles(UserRole.SUPER_ADMIN);
export const requireSuperAdmin = requireRoles(UserRole.SUPER_ADMIN);
export const requireOwnerOrAgent = requireRoles(UserRole.OWNER, UserRole.AGENT, UserRole.SUPER_ADMIN);
export const requireBuilder = requireRoles(UserRole.BUILDER, UserRole.SUPER_ADMIN);
