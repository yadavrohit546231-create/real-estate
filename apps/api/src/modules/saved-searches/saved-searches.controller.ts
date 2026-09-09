import { Response } from 'express';
import { savedSearchesService } from './saved-searches.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class SavedSearchesController {
  async getSavedSearches(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const searches = await savedSearchesService.getSavedSearches(req.user.userId);
      return sendSuccess(res, searches, 'Saved searches fetched');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch saved searches', 400);
    }
  }

  async createSavedSearch(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const search = await savedSearchesService.createSavedSearch(req.user.userId, req.body);
      return sendSuccess(res, search, 'Saved search created', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create saved search', 400);
    }
  }

  async deleteSavedSearch(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { id } = req.params;
      await savedSearchesService.deleteSavedSearch(req.user.userId, id);
      return sendSuccess(res, null, 'Saved search deleted');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete saved search', 400);
    }
  }
}

export const savedSearchesController = new SavedSearchesController();
