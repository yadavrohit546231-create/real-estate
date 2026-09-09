import { Router, Response } from 'express';
import { prisma } from '../../config/database';
import { sendSuccess, sendError } from '../../utils/response';
import { authenticateToken, AuthenticatedRequest } from '../../middleware/auth';
import { requireRoles } from '../../middleware/rbac';
import { validateBody } from '../../middleware/validate';
import { CreateBuilderProjectSchema } from '@real-estate/validation';
import { UserRole, ProjectStatus } from '@real-estate/types';

const router = Router();

// Public: Get all LIVE builder projects
router.get('/', async (req, res) => {
  try {
    const { city, search } = req.query;
    const where: any = { status: ProjectStatus.LIVE };
    if (city) where.city = city as string;
    if (search) {
      where.OR = [
        { name: { contains: search as string } },
        { location: { contains: search as string } },
        { city: { contains: search as string } },
      ];
    }

    const projects = await prisma.builderProject.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        floorPlans: true,
        builder: { select: { name: true, builderProfile: true } },
      },
    });

    return sendSuccess(res, projects);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch projects', 400);
  }
});

// Public: Get single project by ID
router.get('/:id', async (req, res) => {
  try {
    const project = await prisma.builderProject.findUnique({
      where: { id: req.params.id },
      include: {
        towers: {
          include: {
            floors: {
              include: { units: true },
            },
          },
        },
        floorPlans: true,
        amenities: { include: { amenity: true } },
        builder: { select: { id: true, name: true, builderProfile: true } },
      },
    });
    if (!project) return sendError(res, 'Project not found', 404);
    return sendSuccess(res, project);
  } catch (err: any) {
    return sendError(res, err.message || 'Failed to fetch project', 400);
  }
});

// Builder: Create a new project
router.post(
  '/',
  authenticateToken,
  requireRoles(UserRole.BUILDER, UserRole.ADMIN, UserRole.SUPER_ADMIN),
  validateBody(CreateBuilderProjectSchema),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      if (!req.user) return sendError(res, 'Unauthorized', 401);

      const project = await prisma.builderProject.create({
        data: {
          ...req.body,
          builderId: req.user.userId,
          developer: req.user.name || 'Builder',
          status: ProjectStatus.PENDING_REVIEW,
        },
      });

      return sendSuccess(res, project, 'Project created and submitted for review', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to create project', 400);
    }
  }
);

export default router;
