import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/response';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error('Unhandled API Error:', err);

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` on field (${err.meta.target})` : '';
    return sendError(res, `A duplicate record already exists${target}.`, 409);
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return sendError(res, 'The requested resource was not found.', 404);
  }

  // Rate limiter standard message
  if (err.status === 429) {
    return sendError(res, err.message || 'Too many requests, please try again later.', 429);
  }

  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  return sendError(res, message, statusCode);
}
