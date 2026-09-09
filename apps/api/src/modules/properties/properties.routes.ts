import { Router } from 'express';
import { propertiesController } from './properties.controller';
import { authenticateToken, optionalAuth } from '../../middleware/auth';
import { validateBody, validateQuery } from '../../middleware/validate';
import {
  CreatePropertySchema,
  UpdatePropertySchema,
  PropertyFilterQuerySchema,
} from '@real-estate/validation';

const router = Router();

// Public / Filterable browsing
router.get('/', optionalAuth, validateQuery(PropertyFilterQuerySchema), propertiesController.getProperties);
router.get('/:id', optionalAuth, propertiesController.getPropertyById);

// Protected actions: Post, update, submit, delete
router.post('/', authenticateToken, validateBody(CreatePropertySchema), propertiesController.createProperty);
router.put('/:id', authenticateToken, validateBody(UpdatePropertySchema), propertiesController.updateProperty);
router.post('/:id/submit', authenticateToken, propertiesController.submitProperty);
router.delete('/:id', authenticateToken, propertiesController.deleteProperty);

export default router;
