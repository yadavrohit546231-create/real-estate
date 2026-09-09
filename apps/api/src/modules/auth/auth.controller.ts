import { Request, Response } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/response';
import { AuthenticatedRequest } from '../../middleware/auth';

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const result = await authService.register(req.body);
      return sendSuccess(res, result, 'User registered successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Registration failed', 400);
    }
  }

  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;
      const result = await authService.login(email, password);
      return sendSuccess(res, result, 'Login successful');
    } catch (err: any) {
      return sendError(res, err.message || 'Login failed', 401);
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      const tokens = await authService.refreshTokens(refreshToken);
      return sendSuccess(res, tokens, 'Tokens refreshed successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to refresh token', 401);
    }
  }

  async logout(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      await authService.logout(refreshToken);
      return sendSuccess(res, null, 'Logged out successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Logout failed', 400);
    }
  }

  async getMe(req: AuthenticatedRequest, res: Response) {
    try {
      if (!req.user) {
        return sendError(res, 'Unauthorized', 401);
      }
      const user = await authService.getCurrentUser(req.user.userId);
      return sendSuccess(res, user, 'Profile retrieved successfully');
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch user profile', 400);
    }
  }
}

export const authController = new AuthController();
