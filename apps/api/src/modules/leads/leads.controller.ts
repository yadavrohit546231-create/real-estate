import { Response } from 'express';
import { leadsService } from './leads.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class LeadsController {
  async createEnquiry(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { propertyId } = req.params;
      const lead = await leadsService.createEnquiry(propertyId, req.user.userId, req.body);
      return sendSuccess(res, lead, 'Enquiry submitted successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to submit enquiry', 400);
    }
  }

  async getLeads(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const leads = await leadsService.getLeadsForUser(req.user.userId, req.user.role);
      return sendSuccess(res, leads, 'Leads fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch leads', 400);
    }
  }

  async updateStatus(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const { status } = req.body;
      const updated = await leadsService.updateLeadStatus(id, req.user.userId, req.user.role, status);
      return sendSuccess(res, updated, 'Lead status updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update lead status', 400);
    }
  }
}

export const leadsController = new LeadsController();
