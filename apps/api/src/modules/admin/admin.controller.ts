import { Response } from 'express';
import { adminService } from './admin.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AdminController {
  async getDashboard(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await adminService.getDashboardMetrics();
      return sendSuccess(res, data, 'Dashboard metrics fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch dashboard metrics', 400);
    }
  }

  async getPendingProperties(req: AuthenticatedRequest, res: Response) {
    try {
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '20', 10);
      const data = await adminService.getPendingProperties(page, limit);
      return sendSuccess(res, data, 'Pending properties fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch pending properties', 400);
    }
  }

  async approveProperty(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      const approved = await adminService.approveProperty(id, req.user.userId);
      return sendSuccess(res, approved, 'Property approved successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to approve property', 400);
    }
  }

  async rejectProperty(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      const { reason } = req.body;
      const rejected = await adminService.rejectProperty(id, req.user.userId, reason);
      return sendSuccess(res, rejected, 'Property rejected successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to reject property', 400);
    }
  }

  async getAllProperties(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await adminService.getAllProperties(req.query);
      return sendSuccess(res, data, 'Properties fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch properties', 400);
    }
  }

  async getAllUsers(req: AuthenticatedRequest, res: Response) {
    try {
      const data = await adminService.getAllUsers(req.query);
      return sendSuccess(res, data, 'Users fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch users', 400);
    }
  }

  async toggleUserStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      const user = await adminService.toggleUserStatus(id, req.user.userId, req.user.role);
      return sendSuccess(res, user, 'User status updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update user status', 400);
    }
  }

  async verifyAgent(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      const { status, reason } = req.body;
      const agent = await adminService.verifyAgent(id, req.user.userId, status, reason);
      return sendSuccess(res, agent, 'Agent verification updated');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update agent verification', 400);
    }
  }

  async verifyBuilder(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      const { status, reason } = req.body;
      const builder = await adminService.verifyBuilder(id, req.user.userId, status, reason);
      return sendSuccess(res, builder, 'Builder verification updated');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update builder verification', 400);
    }
  }

  async exportReport(req: AuthenticatedRequest, res: Response) {
    try {
      const type = (req.query.type as string) || 'properties';
      const csv = await adminService.exportReportCSV(type as any);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=report-${type}-${Date.now()}.csv`);
      return res.send(csv);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to export report', 400);
    }
  }
}

export const adminController = new AdminController();
