import { Router, Request, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { search, city } = req.query;
    const where: any = {};
    if (city) where.city = city as string;
    if (search) {
      where.OR = [
        { city: { contains: search as string } },
        { locality: { contains: search as string } },
        { state: { contains: search as string } },
      ];
    }

    const locations = await prisma.location.findMany({
      where,
      orderBy: [{ city: 'asc' }, { locality: 'asc' }],
      take: 50,
    });

    // Also get distinct list of cities
    const distinctCities = await prisma.location.findMany({
      distinct: ['city'],
      select: { city: true, state: true },
      orderBy: { city: 'asc' },
    });

    return sendSuccess(res, { locations, cities: distinctCities.map((c) => c.city) });
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch locations', 400);
  }
});

export default router;
