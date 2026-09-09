import { Response } from 'express';
import { paymentsService } from './payments.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class PaymentsController {
  async createOrder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const result = await paymentsService.createOrder(req.user.userId, req.body);
      return sendSuccess(res, result, 'Payment order created');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create payment order', 400);
    }
  }

  async verifyPayment(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const result = await paymentsService.verifyPayment(req.user.userId, req.body);
      return sendSuccess(res, result, 'Payment verified successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Payment verification failed', 400);
    }
  }

  async getPayments(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const payments = await paymentsService.getPaymentsForUser(req.user.userId);
      return sendSuccess(res, payments, 'Payment history fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch payments', 400);
    }
  }
}

export const paymentsController = new PaymentsController();
