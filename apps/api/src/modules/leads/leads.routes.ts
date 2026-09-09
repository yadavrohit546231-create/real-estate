import { Router } from 'express';
import { leadsController } from './leads.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { CreateLeadSchema, UpdateLeadStatusSchema } from '@real-estate/validation';

const router = Router();

// Submit enquiry for a property
router.post('/property/:propertyId', authenticateToken, validateBody(CreateLeadSchema), leadsController.createEnquiry);

// Query leads relevant to the user
router.get('/', authenticateToken, leadsController.getLeads);

// Update status of lead
router.patch('/:id/status', authenticateToken, validateBody(UpdateLeadStatusSchema), leadsController.updateStatus);

export default router;
