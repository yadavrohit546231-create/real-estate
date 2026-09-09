import { Router } from 'express';
import { notificationsController } from './notifications.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', notificationsController.getNotifications);
router.patch('/:id/read', notificationsController.markAsRead);
router.patch('/read-all', notificationsController.markAllAsRead);
router.post('/token', notificationsController.registerToken);

export default router;
