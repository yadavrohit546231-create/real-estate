import { Router } from 'express';
import authRoutes from '../modules/auth/auth.routes';
import propertiesRoutes from '../modules/properties/properties.routes';
import adminRoutes from '../modules/admin/admin.routes';
import leadsRoutes from '../modules/leads/leads.routes';
import siteVisitsRoutes from '../modules/site-visits/site-visits.routes';
import favoritesRoutes from '../modules/favorites/favorites.routes';
import savedSearchesRoutes from '../modules/saved-searches/saved-searches.routes';
import notificationsRoutes from '../modules/notifications/notifications.routes';
import paymentsRoutes from '../modules/payments/payments.routes';
import locationsRoutes from '../modules/locations/locations.routes';
import amenitiesRoutes from '../modules/amenities/amenities.routes';
import agentsRoutes from '../modules/agents/agents.routes';
import buildersRoutes from '../modules/builders/builders.routes';
import projectsRoutes from '../modules/projects/projects.routes';
import uploadRoutes from '../modules/upload/upload.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/properties', propertiesRoutes);
router.use('/admin', adminRoutes);
router.use('/leads', leadsRoutes);
router.use('/site-visits', siteVisitsRoutes);
router.use('/favorites', favoritesRoutes);
router.use('/saved-searches', savedSearchesRoutes);
router.use('/notifications', notificationsRoutes);
router.use('/payments', paymentsRoutes);
router.use('/locations', locationsRoutes);
router.use('/amenities', amenitiesRoutes);
router.use('/agents', agentsRoutes);
router.use('/builders', buildersRoutes);
router.use('/projects', projectsRoutes);
router.use('/upload', uploadRoutes);

export default router;
