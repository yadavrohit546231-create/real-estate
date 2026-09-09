import { Response } from 'express';
import { favoritesService } from './favorites.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class FavoritesController {
  async getFavorites(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const favorites = await favoritesService.getFavorites(req.user.userId);
      return sendSuccess(res, favorites, 'Favorites fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch favorites', 400);
    }
  }

  async addFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { propertyId } = req.params;
      const result = await favoritesService.addFavorite(req.user.userId, propertyId);
      return sendSuccess(res, result, 'Property added to favorites');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to add favorite', 400);
    }
  }

  async removeFavorite(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);
      const { propertyId } = req.params;
      await favoritesService.removeFavorite(req.user.userId, propertyId);
      return sendSuccess(res, null, 'Property removed from favorites');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to remove favorite', 400);
    }
  }
}

export const favoritesController = new FavoritesController();
