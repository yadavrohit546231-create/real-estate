import { Response } from 'express';
import { notificationsService } from './notifications.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class NotificationsController {
  async getNotifications(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const data = await notificationsService.getNotifications(req.user.userId);
      return sendSuccess(res, data, 'Notifications fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch notifications', 400);
    }
  }

  async markAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      await notificationsService.markAsRead(req.user.userId, id);
      return sendSuccess(res, null, 'Notification marked as read');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to mark notification as read', 400);
    }
  }

  async markAllAsRead(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      await notificationsService.markAllAsRead(req.user.userId);
      return sendSuccess(res, null, 'All notifications marked as read');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to mark all as read', 400);
    }
  }

  async registerToken(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { token, deviceType } = req.body;
      await notificationsService.registerPushToken(req.user.userId, token, deviceType);
      return sendSuccess(res, null, 'Push token registered');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to register push token', 400);
    }
  }
}

export const notificationsController = new NotificationsController();
