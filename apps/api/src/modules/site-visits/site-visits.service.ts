import { prisma } from '../../config/database';
import { SiteVisitStatus, NotificationType, UserRole } from '@real-estate/types';

export class SiteVisitsService {
  async scheduleVisit(propertyId: string, userId: string, data: {
    visitDate: string;
    timeSlot: string;
    notes?: string;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, ownerId: true, agentId: true },
    });

    if (!property) throw new Error('Property not found');

    const siteVisit = await prisma.siteVisit.create({
      data: {
        propertyId,
        userId,
        ownerId: property.ownerId,
        agentId: property.agentId,
        visitDate: new Date(data.visitDate),
        timeSlot: data.timeSlot,
        notes: data.notes,
        status: SiteVisitStatus.REQUESTED,
      },
      include: {
        property: { select: { title: true, locality: true, city: true } },
      },
    });

    const visitor = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, phone: true, email: true, role: true, status: true },
    });

    const visitorRoleLabel = visitor?.role === UserRole.AGENT
      ? 'Real Estate Agent'
      : visitor?.role === UserRole.BUILDER
        ? 'Builder / Developer'
        : visitor?.role === UserRole.OWNER
          ? 'Property Owner'
          : 'Buyer';

    // Notify owner
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        title: `New Site Visit Request from ${visitorRoleLabel}!`,
        message: `${visitor?.name || 'A user'} (${visitorRoleLabel}) requested a site visit for "${property.title}" on ${data.visitDate} (${data.timeSlot}).`,
        type: NotificationType.SITE_VISIT_REQUEST,
        entityType: 'SiteVisit',
        entityId: siteVisit.id,
      },
    });

    return siteVisit;
  }

  async getVisitsForUser(userId: string, role: UserRole) {
    let where: any = {};
    if (role === UserRole.SUPER_ADMIN) {
      where = {};
    } else if (role === UserRole.AGENT) {
      where = { OR: [{ ownerId: userId }, { agentId: userId }] };
    } else if (role === UserRole.OWNER || role === UserRole.BUILDER) {
      where = { ownerId: userId };
    } else {
      where = { userId };
    }

    return prisma.siteVisit.findMany({
      where,
      orderBy: { visitDate: 'asc' },
      include: {
        property: { select: { id: true, title: true, locality: true, city: true, images: { take: 1 } } },
        user: { select: { id: true, name: true, phone: true, email: true, role: true, status: true, avatarUrl: true } },
      },
    });
  }

  async updateVisitStatus(visitId: string, userId: string, role: UserRole, status: SiteVisitStatus, notes?: string) {
    const visit = await prisma.siteVisit.findUnique({
      where: { id: visitId },
      include: { property: { select: { title: true } } },
    });
    if (!visit) throw new Error('Site visit not found');

    const isAuthorized =
      role === UserRole.SUPER_ADMIN ||
      visit.ownerId === userId ||
      visit.agentId === userId ||
      visit.userId === userId;

    if (!isAuthorized) throw new Error('Unauthorized');

    const updated = await prisma.siteVisit.update({
      where: { id: visitId },
      data: { status, notes: notes || visit.notes },
    });

    // Notify the buyer of decision
    let notifType = NotificationType.GENERAL;
    if (status === SiteVisitStatus.CONFIRMED) notifType = NotificationType.SITE_VISIT_ACCEPTED;
    if (status === SiteVisitStatus.REJECTED) notifType = NotificationType.SITE_VISIT_REJECTED;

    await prisma.notification.create({
      data: {
        userId: visit.userId,
        title: `Site Visit ${status}`,
        message: `Your visit request for "${visit.property.title}" has been marked as ${status}.`,
        type: notifType,
        entityType: 'SiteVisit',
        entityId: visit.id,
      },
    });

    return updated;
  }
}

export const siteVisitsService = new SiteVisitsService();
