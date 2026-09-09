import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { BuilderRegistrationSchema } from '@real-estate/validation';
import { UserRole, VerificationStatus } from '@real-estate/types';

const router = Router();

router.post('/register', authenticateToken, validateBody(BuilderRegistrationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);

    const profile = await prisma.builderProfile.upsert({
      where: { userId: req.user.userId },
      update: {
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        reraNumber: req.body.reraNumber,
        website: req.body.website,
        description: req.body.description,
        logoUrl: req.body.logoUrl,
        status: VerificationStatus.PENDING,
      },
      create: {
        userId: req.user.userId,
        companyName: req.body.companyName,
        companyAddress: req.body.companyAddress,
        reraNumber: req.body.reraNumber,
        website: req.body.website,
        description: req.body.description,
        logoUrl: req.body.logoUrl,
        status: VerificationStatus.PENDING,
      },
    });

    await prisma.user.update({
      where: { id: req.user.userId },
      data: { role: UserRole.BUILDER },
    });

    return sendSuccess(res, profile, 'Builder registration submitted for review', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to submit builder profile', 400);
  }
});

router.get('/:id', async (req, res) => {
  try {
    const builder = await prisma.builderProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });
    if (!builder) return sendError(res, 'Builder not found', 404);
    return sendSuccess(res, builder);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch builder', 400);
  }
});

export default router;
