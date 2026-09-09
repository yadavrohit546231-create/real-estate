import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken, TokenPayload } from '../utils/jwt';
import { sendError } from '../utils/response';
import { prisma } from '../config/database';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload & { name?: string; status?: string };
}

export async function authenticateToken(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    sendError(res, 'Authentication token is missing', 401);
    return;
  }

  try {
    const payload = verifyAccessToken(token);
    
    // Check if user is still active in database
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true, name: true },
    });

    if (!user) {
      sendError(res, 'User account no longer exists', 401);
      return;
    }

    if (user.status === 'SUSPENDED') {
      sendError(res, 'User account has been suspended', 403);
      return;
    }

    req.user = {
      userId: user.id,
      email: user.email,
      role: user.role as any,
      name: user.name,
      status: user.status,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      sendError(res, 'Access token has expired', 401);
      return;
    }
    sendError(res, 'Invalid access token', 401);
    return;
  }
}

export async function optionalAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return next();
  }

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { id: true, email: true, role: true, status: true, name: true },
    });

    if (user && user.status !== 'SUSPENDED') {
      req.user = {
        userId: user.id,
        email: user.email,
        role: user.role as any,
        name: user.name,
        status: user.status,
      };
    }
  } catch {
    // Silently continue for optional auth
  }

  next();
}
