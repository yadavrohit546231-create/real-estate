import { Router } from 'express';
import { savedSearchesController } from './saved-searches.controller';
import { authenticateToken } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { CreateSavedSearchSchema } from '@real-estate/validation';

const router = Router();

router.use(authenticateToken);

router.get('/', savedSearchesController.getSavedSearches);
router.post('/', validateBody(CreateSavedSearchSchema), savedSearchesController.createSavedSearch);
router.delete('/:id', savedSearchesController.deleteSavedSearch);

export default router;
