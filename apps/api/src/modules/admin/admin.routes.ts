import { Router } from 'express';
import { adminController } from './admin.controller';
import { authenticateToken } from '../../middleware/auth';
import { requireAdmin } from '../../middleware/rbac';

const router = Router();

// All platform manager routes require authentication and SUPER_ADMIN (Platform Manager) role
router.use(authenticateToken, requireAdmin);

router.get('/dashboard', adminController.getDashboard);
router.get('/properties/pending', adminController.getPendingProperties);
router.post('/properties/:id/approve', adminController.approveProperty);
router.post('/properties/:id/reject', adminController.rejectProperty);
router.post('/properties/:id/toggle-featured', adminController.toggleFeaturedProperty);
router.get('/properties', adminController.getAllProperties);
router.get('/users', adminController.getAllUsers);
router.patch('/users/:id/toggle-status', adminController.toggleUserStatus);
router.patch('/agents/:id/verify', adminController.verifyAgent);
router.patch('/builders/:id/verify', adminController.verifyBuilder);
router.get('/reports/export', adminController.exportReport);

export default router;
