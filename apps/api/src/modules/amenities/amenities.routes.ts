import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  try {
    const amenities = await prisma.amenity.findMany({
      orderBy: { name: 'asc' },
    });
    return sendSuccess(res, amenities);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch amenities', 400);
  }
});

export default router;
