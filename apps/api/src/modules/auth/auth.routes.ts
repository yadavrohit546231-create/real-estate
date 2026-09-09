import { Router } from 'express';
import { authController } from './auth.controller';
import { validateBody } from '../../middleware/validate';
import { authenticateToken } from '../../middleware/auth';
import { authRateLimiter } from '../../middleware/rateLimiter';
import { RegisterSchema, LoginSchema, RefreshTokenSchema } from '@real-estate/validation';

const router = Router();

router.post('/register', authRateLimiter, validateBody(RegisterSchema), authController.register);
router.post('/login', authRateLimiter, validateBody(LoginSchema), authController.login);
router.post('/refresh', validateBody(RefreshTokenSchema), authController.refresh);
router.post('/logout', authController.logout);
router.get('/me', authenticateToken, authController.getMe);

export default router;
