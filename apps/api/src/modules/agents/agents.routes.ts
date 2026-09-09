import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import { AgentRegistrationSchema } from '@real-estate/validation';
import { UserRole, VerificationStatus } from '@real-estate/types';

const router = Router();

// Register as agent
router.post('/register', authenticateToken, validateBody(AgentRegistrationSchema), async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) return sendError(res, 'Unauthorized', 401);

    const profile = await prisma.agentProfile.upsert({
      where: { userId: req.user.userId },
      update: {
        agencyName: req.body.agencyName,
        agencyAddress: req.body.agencyAddress,
        licenseNumber: req.body.licenseNumber,
        experienceYears: req.body.experienceYears,
        bio: req.body.bio,
        status: VerificationStatus.PENDING,
      },
      create: {
        userId: req.user.userId,
        agencyName: req.body.agencyName,
        agencyAddress: req.body.agencyAddress,
        licenseNumber: req.body.licenseNumber,
        experienceYears: req.body.experienceYears,
        bio: req.body.bio,
        status: VerificationStatus.PENDING,
      },
    });

    // Update role to AGENT
    await prisma.user.update({
      where: { id: req.user.userId },
      data: { role: UserRole.AGENT },
    });

    return sendSuccess(res, profile, 'Agent application submitted for admin verification', 201);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to submit agent profile', 400);
  }
});

// Get agent profile by ID
router.get('/:id', async (req, res) => {
  try {
    const agent = await prisma.agentProfile.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { id: true, name: true, phone: true, email: true, avatarUrl: true } },
      },
    });
    if (!agent) return sendError(res, 'Agent not found', 404);
    return sendSuccess(res, agent);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch agent profile', 400);
  }
});

export default router;
