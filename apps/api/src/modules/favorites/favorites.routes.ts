import { Router } from 'express';
import { favoritesController } from './favorites.controller';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

router.use(authenticateToken);

router.get('/', favoritesController.getFavorites);
router.post('/:propertyId', favoritesController.addFavorite);
router.delete('/:propertyId', favoritesController.removeFavorite);

export default router;
