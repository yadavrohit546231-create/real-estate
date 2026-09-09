import { Response } from 'express';
import { siteVisitsService } from './site-visits.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';
import { SiteVisitStatus } from '@real-estate/types';

export class SiteVisitsController {
  async scheduleVisit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { propertyId } = req.params;
      const visit = await siteVisitsService.scheduleVisit(propertyId, req.user.userId, req.body);
      return sendSuccess(res, visit, 'Site visit requested successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to schedule site visit', 400);
    }
  }

  async getVisits(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const visits = await siteVisitsService.getVisitsForUser(req.user.userId, req.user.role);
      return sendSuccess(res, visits, 'Site visits fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch site visits', 400);
    }
  }

  async acceptVisit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const updated = await siteVisitsService.updateVisitStatus(id, req.user.userId, req.user.role, SiteVisitStatus.CONFIRMED, req.body.notes);
      return sendSuccess(res, updated, 'Site visit confirmed');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to confirm site visit', 400);
    }
  }

  async rejectVisit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const updated = await siteVisitsService.updateVisitStatus(id, req.user.userId, req.user.role, SiteVisitStatus.REJECTED, req.body.notes);
      return sendSuccess(res, updated, 'Site visit rejected');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to reject site visit', 400);
    }
  }

  async cancelVisit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const updated = await siteVisitsService.updateVisitStatus(id, req.user.userId, req.user.role, SiteVisitStatus.CANCELLED, req.body.notes);
      return sendSuccess(res, updated, 'Site visit cancelled');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to cancel site visit', 400);
    }
  }

  async completeVisit(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const updated = await siteVisitsService.updateVisitStatus(id, req.user.userId, req.user.role, SiteVisitStatus.COMPLETED, req.body.notes);
      return sendSuccess(res, updated, 'Site visit completed');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to complete site visit', 400);
    }
  }
}

export const siteVisitsController = new SiteVisitsController();
