import { Router } from 'express';
import { siteVisitsController } from './site-visits.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { ScheduleSiteVisitSchema } from '@real-estate/validation';

const router = Router();

router.use(authenticateToken);

router.post('/property/:propertyId', validateBody(ScheduleSiteVisitSchema), siteVisitsController.scheduleVisit);
router.get('/', siteVisitsController.getVisits);
router.patch('/:id/accept', siteVisitsController.acceptVisit);
router.patch('/:id/reject', siteVisitsController.rejectVisit);
router.patch('/:id/cancel', siteVisitsController.cancelVisit);
router.patch('/:id/complete', siteVisitsController.completeVisit);

export default router;
