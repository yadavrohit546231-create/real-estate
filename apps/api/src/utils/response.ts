import { Response } from 'express';
import { ApiResponse } from '@real-estate/types';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
) {
  const payload: ApiResponse<T> = {
    success: true,
    message,
    data,
  };
  return res.status(statusCode).json(payload);
}

export function sendError(
  res: Response,
  message: string,
  statusCode: number = 400,
  errors?: string[]
) {
  const payload: ApiResponse = {
    success: false,
    message,
    errors: errors && errors.length > 0 ? errors : undefined,
  };
  return res.status(statusCode).json(payload);
}
