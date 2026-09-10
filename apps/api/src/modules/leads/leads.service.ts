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

    let buyer = await prisma.user.findUnique({
      where: { id: buyerId },
      select: { id: true, name: true, phone: true, email: true, role: true, status: true },
    });

    if (!buyer || buyer.role === UserRole.BUYER) {
      const matchByEmailOrPhone = await prisma.user.findFirst({
        where: {
          OR: [
            ...(data.email ? [{ email: data.email.toLowerCase() }] : []),
            ...(data.phone ? [{ phone: data.phone }] : []),
          ],
        },
        select: { id: true, name: true, phone: true, email: true, role: true, status: true },
      });
      if (matchByEmailOrPhone && matchByEmailOrPhone.role !== UserRole.BUYER) {
        buyer = matchByEmailOrPhone;
        buyerId = matchByEmailOrPhone.id;
      }
    }

    const roleLabel = buyer?.role === UserRole.AGENT
      ? 'Real Estate Agent'
      : buyer?.role === UserRole.BUILDER
        ? 'Builder / Developer'
        : buyer?.role === UserRole.OWNER
          ? 'Property Owner'
          : 'Buyer';

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
        buyer: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
            role: true,
            status: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Notify the property owner with buyer's role & status
    await prisma.notification.create({
      data: {
        userId: property.ownerId,
        title: `New Enquiry from ${roleLabel}!`,
        message: `${data.name} (${roleLabel} • ${buyer?.status || 'ACTIVE'}) submitted an enquiry for "${property.title}". Contact: ${data.phone}`,
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
          title: `New Lead Enquiry from ${roleLabel}!`,
          message: `${data.name} (${roleLabel}) sent an enquiry for "${property.title}". Contact: ${data.phone}`,
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

    const rawLeads = await prisma.lead.findMany({
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
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            role: true,
            status: true,
            avatarUrl: true,
          },
        },
      },
    });

    // Robustly resolve buyer role (even if legacy lead had buyer missing or was buyer role while phone/email matches an agent/builder)
    const enhancedLeads = await Promise.all(
      rawLeads.map(async (lead) => {
        let buyer = lead.buyer;
        if (!buyer || buyer.role === UserRole.BUYER) {
          const matched = await prisma.user.findFirst({
            where: {
              OR: [
                ...(lead.email ? [{ email: lead.email.toLowerCase() }] : []),
                ...(lead.phone ? [{ phone: lead.phone }] : []),
              ],
            },
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              role: true,
              status: true,
              avatarUrl: true,
            },
          });
          if (matched && matched.role !== UserRole.BUYER) {
            buyer = matched;
          }
        }

        const effectiveRole = buyer?.role || UserRole.BUYER;
        const effectiveStatus = buyer?.status || 'ACTIVE';

        return {
          ...lead,
          buyer,
          inquirerRole: effectiveRole,
          inquirerStatus: effectiveStatus,
        };
      })
    );

    return enhancedLeads;
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
