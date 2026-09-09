import { Response } from 'express';
import { propertiesService } from './properties.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class PropertiesController {
  async getProperties(req: AuthenticatedRequest, res: Response) {
    try {
      const result = await propertiesService.getProperties(req.query, req.user);
      return sendSuccess(res, result, 'Properties fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch properties', 400);
    }
  }

  async getPropertyById(req: AuthenticatedRequest, res: Response) {
    try {
      const { id } = req.params;
      const property = await propertiesService.getPropertyById(id, req.user);
      return sendSuccess(res, property, 'Property fetched successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Property not found', 404);
    }
  }

  async createProperty(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const property = await propertiesService.createProperty(req.user.userId, req.body);
      return sendSuccess(res, property, 'Property created successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create property', 400);
    }
  }

  async updateProperty(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const updated = await propertiesService.updateProperty(id, req.user.userId, req.user.role, req.body);
      return sendSuccess(res, updated, 'Property updated successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update property', 400);
    }
  }

  async submitProperty(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      const submitted = await propertiesService.submitProperty(id, req.user.userId);
      return sendSuccess(res, submitted, 'Property submitted for review successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to submit property', 400);
    }
  }

  async deleteProperty(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) return sendError(res, 'Authentication required', 401);
      const { id } = req.params;
      await propertiesService.deleteProperty(id, req.user.userId, req.user.role);
      return sendSuccess(res, null, 'Property deleted successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to delete property', 400);
    }
  }
}

export const propertiesController = new PropertiesController();
