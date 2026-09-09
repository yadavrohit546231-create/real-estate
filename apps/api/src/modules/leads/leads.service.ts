import { prisma } from '../../config/database';
import { LeadSource, LeadStatus, NotificationType, UserRole } from '@real-estate/types';

export class LeadsService {
  async createEnquiry(propertyId: string, buyerId: string, data: {
    name: string;
    phone: string;
    email: string;
    message?: string;
    source?: LeadSource;
  }) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true, title: true, ownerId: true, agentId: true },
    });

    if (!property) throw new Error('Property not found');

    const lead = await prisma.lead.create({
      data: {
        propertyId,
        buyerId,
        ownerId: property.ownerId,
        agentId: property.agentId,
        name: data.name,
        phone: data.phone,
        email: data.email,
        message: data.message,
        source: data.source || LeadSource.ENQUIRY,
        status: LeadStatus.NEW,
      },
      include: {
        property: { select: { id: true, title: true, price: true, city: true } },
      },
    });

    // Notify the property owner
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        title: 'New Lead Enquiry Received!',
        message: `${data.name} expressed interest in "${property.title}". Contact: ${data.phone}`,
        type: NotificationType.NEW_LEAD,
        entityType: 'Lead',
        entityId: lead.id,
      },
    });

    // Also notify agent if assigned
    if (property.agentId) {
      await prisma.notification.create({
        data: {
          userId: property.agentId,
          title: 'New Lead Enquiry (Agent Listing)!',
          message: `${data.name} sent enquiry for "${property.title}".`,
          type: NotificationType.NEW_LEAD,
          entityType: 'Lead',
          entityId: lead.id,
        },
      });
    }

    return lead;
  }

  async getLeadsForUser(userId: string, role: UserRole) {
    let where: any = {};
    if (role === UserRole.SUPER_ADMIN) {
      where = {};
    } else if (role === UserRole.AGENT) {
      where = { OR: [{ ownerId: userId }, { agentId: userId }] };
    } else if (role === UserRole.OWNER || role === UserRole.BUILDER) {
      where = { ownerId: userId };
    } else {
      where = { buyerId: userId };
    }

    return prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            price: true,
            city: true,
            locality: true,
            images: { take: 1 },
          },
        },
      },
    });
  }

  async updateLeadStatus(leadId: string, userId: string, role: UserRole, status: LeadStatus) {
    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) throw new Error('Lead not found');

    const isAuthorized =
      role === UserRole.SUPER_ADMIN ||
      lead.ownerId === userId ||
      lead.agentId === userId;

    if (!isAuthorized) throw new Error('Unauthorized');

    const updated = await prisma.lead.update({
      where: { id: leadId },
      data: { status },
    });

    return updated;
  }
}

export const leadsService = new LeadsService();
