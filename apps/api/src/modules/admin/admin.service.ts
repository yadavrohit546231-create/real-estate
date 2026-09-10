import { prisma } from '../../config/database';
import {
  PropertyStatus,
  ApprovalDecision,
  NotificationType,
  UserRole,
  VerificationStatus,
} from '@real-estate/types';

export class AdminService {
  async getDashboardMetrics() {
    const [
      totalUsers,
      totalProperties,
      pendingProperties,
      liveProperties,
      rejectedProperties,
      featuredProperties,
      totalLeads,
      totalSiteVisits,
      paymentsSummary,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.property.count(),
      prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW } }),
      prisma.property.count({ where: { status: PropertyStatus.LIVE } }),
      prisma.property.count({ where: { status: PropertyStatus.REJECTED } }),
      prisma.property.count({ where: { isFeatured: true } }),
      prisma.lead.count(),
      prisma.siteVisit.count(),
      prisma.payment.aggregate({
        where: { status: 'SUCCESS' },
        _sum: { amount: true },
        _count: true,
      }),
    ]);

    // Distribution by City
    const cityDistribution = await prisma.property.groupBy({
      by: ['city'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 5,
    });

    // Distribution by Category
    const categoryDistribution = await prisma.property.groupBy({
      by: ['category'],
      _count: { id: true },
    });

    // Recent 5 Pending Properties for quick action
    const pendingReviewList = await prisma.property.findMany({
      where: { status: PropertyStatus.PENDING_REVIEW },
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        owner: { select: { id: true, name: true, email: true, phone: true } },
        images: { take: 1 },
      },
    });

    return {
      stats: {
        totalUsers,
        totalProperties,
        pendingProperties,
        liveProperties,
        rejectedProperties,
        featuredProperties,
        totalLeads,
        totalSiteVisits,
        totalRevenue: paymentsSummary._sum.amount || 0,
        successfulTransactions: paymentsSummary._count,
      },
      cityDistribution: cityDistribution.map((c) => ({ city: c.city, count: c._count.id })),
      categoryDistribution: categoryDistribution.map((c) => ({ category: c.category, count: c._count.id })),
      recentPending: pendingReviewList,
    };
  }

  async getPendingProperties(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [total, properties] = await Promise.all([
      prisma.property.count({ where: { status: PropertyStatus.PENDING_REVIEW } }),
      prisma.property.findMany({
        where: { status: PropertyStatus.PENDING_REVIEW },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          amenities: { include: { amenity: true } },
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    return {
      data: properties,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    };
  }

  async approveProperty(propertyId: string, adminId: string, options?: { makeFeatured?: boolean }) {
    return prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({ where: { id: propertyId } });
      if (!property) throw new Error('Property not found');

      const shouldFeature = options?.makeFeatured ?? false;
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          status: PropertyStatus.LIVE,
          isVerified: true,
          rejectionReason: null,
          ...(shouldFeature
            ? {
                isFeatured: true,
                featuredFrom: now,
                featuredUntil: thirtyDaysLater,
              }
            : {}),
        },
      });

      await tx.propertyApproval.create({
        data: {
          propertyId,
          adminId,
          decision: ApprovalDecision.APPROVED,
        },
      });

      await tx.notification.create({
        data: {
          userId: property.ownerId,
          title: 'Property Listing Approved!',
          message: shouldFeature
            ? `Your property "${property.title}" has been approved and featured on the home screen!`
            : `Your property "${property.title}" has been approved and is now LIVE on the platform.`,
          type: NotificationType.PROPERTY_APPROVED,
          entityType: 'Property',
          entityId: property.id,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId,
          action: shouldFeature ? 'PROPERTY_APPROVED_AND_FEATURED' : 'PROPERTY_APPROVED',
          entityType: 'Property',
          entityId: property.id,
          metadata: JSON.stringify({ propertyTitle: property.title, isFeatured: shouldFeature }),
        },
      });

      return updated;
    });
  }

  async toggleFeaturedProperty(propertyId: string, adminId: string, isFeatured?: boolean) {
    return prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({ where: { id: propertyId } });
      if (!property) throw new Error('Property not found');

      const nextFeatured = isFeatured !== undefined ? isFeatured : !property.isFeatured;
      const now = new Date();
      const thirtyDaysLater = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          isFeatured: nextFeatured,
          featuredFrom: nextFeatured ? now : null,
          featuredUntil: nextFeatured ? thirtyDaysLater : null,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId,
          action: nextFeatured ? 'PROPERTY_FEATURED' : 'PROPERTY_UNFEATURED',
          entityType: 'Property',
          entityId: property.id,
          metadata: JSON.stringify({ propertyTitle: property.title, isFeatured: nextFeatured }),
        },
      });

      return updated;
    });
  }

  async rejectProperty(propertyId: string, adminId: string, reason: string) {
    if (!reason || reason.trim().length < 5) {
      throw new Error('A rejection reason of at least 5 characters is required');
    }

    return prisma.$transaction(async (tx) => {
      const property = await tx.property.findUnique({ where: { id: propertyId } });
      if (!property) throw new Error('Property not found');

      const updated = await tx.property.update({
        where: { id: propertyId },
        data: {
          status: PropertyStatus.REJECTED,
          rejectionReason: reason.trim(),
        },
      });

      await tx.propertyApproval.create({
        data: {
          propertyId,
          adminId,
          decision: ApprovalDecision.REJECTED,
          reason: reason.trim(),
        },
      });

      await tx.notification.create({
        data: {
          userId: property.ownerId,
          title: 'Property Listing Requires Attention',
          message: `Your property "${property.title}" was not approved. Reason: ${reason.trim()}. Please edit and resubmit.`,
          type: NotificationType.PROPERTY_REJECTED,
          entityType: 'Property',
          entityId: property.id,
        },
      });

      await tx.adminAction.create({
        data: {
          adminId,
          action: 'PROPERTY_REJECTED',
          entityType: 'Property',
          entityId: property.id,
          metadata: JSON.stringify({ reason: reason.trim() }),
        },
      });

      return updated;
    });
  }

  async getAllProperties(query: any) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) where.status = query.status;
    if (query.city) where.city = query.city;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { locality: { contains: query.search } },
        { city: { contains: query.search } },
      ];
    }

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          images: true,
          amenities: { include: { amenity: true } },
          owner: { select: { id: true, name: true, email: true, phone: true } },
        },
      }),
    ]);

    return {
      data: properties,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async getAllUsers(query: any) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.role) where.role = query.role;
    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { email: { contains: query.search } },
        { phone: { contains: query.search } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          name: true,
          email: true,
          phone: true,
          role: true,
          status: true,
          avatarUrl: true,
          createdAt: true,
          _count: {
            select: {
              propertiesOwned: true,
              leadsCreated: true,
              leadsReceived: true,
            },
          },
        },
      }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async toggleUserStatus(targetUserId: string, adminUserId: string, adminRole: UserRole) {
    const target = await prisma.user.findUnique({ where: { id: targetUserId } });
    if (!target) throw new Error('User not found');

    if (target.role === UserRole.SUPER_ADMIN) {
      throw new Error('Forbidden: Platform Manager (Super Admin) account cannot be deactivated');
    }

    const nextStatus = target.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const updated = await prisma.user.update({
      where: { id: targetUserId },
      data: { status: nextStatus },
      select: { id: true, name: true, email: true, status: true, role: true },
    });

    await prisma.adminAction.create({
      data: {
        adminId: adminUserId,
        action: `USER_STATUS_${nextStatus}`,
        entityType: 'User',
        entityId: targetUserId,
      },
    });

    return updated;
  }

  async verifyAgent(agentProfileId: string, adminId: string, status: VerificationStatus, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.agentProfile.update({
        where: { id: agentProfileId },
        data: {
          status,
          rejectionReason: status === VerificationStatus.REJECTED ? reason : null,
        },
        include: { user: true },
      });

      await tx.notification.create({
        data: {
          userId: updated.userId,
          title: `Agent Verification ${status}`,
          message:
            status === VerificationStatus.VERIFIED
              ? 'Congratulations! Your agent profile has been verified by the administration.'
              : `Your agent verification was rejected. Reason: ${reason || 'Incomplete documents.'}`,
          type: NotificationType.ACCOUNT_VERIFIED,
          entityType: 'AgentProfile',
          entityId: agentProfileId,
        },
      });

      return updated;
    });
  }

  async verifyBuilder(builderProfileId: string, adminId: string, status: VerificationStatus, reason?: string) {
    return prisma.$transaction(async (tx) => {
      const updated = await tx.builderProfile.update({
        where: { id: builderProfileId },
        data: {
          status,
          rejectionReason: status === VerificationStatus.REJECTED ? reason : null,
        },
        include: { user: true },
      });

      await tx.notification.create({
        data: {
          userId: updated.userId,
          title: `Builder Verification ${status}`,
          message:
            status === VerificationStatus.VERIFIED
              ? 'Congratulations! Your builder profile has been verified.'
              : `Your builder verification was rejected. Reason: ${reason || 'Documentation incomplete.'}`,
          type: NotificationType.ACCOUNT_VERIFIED,
          entityType: 'BuilderProfile',
          entityId: builderProfileId,
        },
      });

      return updated;
    });
  }

  async exportReportCSV(type: 'properties' | 'leads' | 'revenue') {
    if (type === 'properties') {
      const properties = await prisma.property.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        include: { owner: { select: { name: true, email: true } } },
      });

      const header = 'ID,Title,Category,Type,City,Price,Status,Owner Name,Owner Email,Created At\n';
      const rows = properties.map((p) =>
        `"${p.id}","${p.title.replace(/"/g, '""')}","${p.category}","${p.propertyType}","${p.city}",${p.price},"${p.status}","${p.owner?.name || ''}","${p.owner?.email || ''}","${p.createdAt.toISOString()}"`
      ).join('\n');
      return header + rows;
    }

    if (type === 'leads') {
      const leads = await prisma.lead.findMany({
        take: 500,
        orderBy: { createdAt: 'desc' },
        include: { property: { select: { title: true } } },
      });

      const header = 'ID,Property Title,Name,Email,Phone,Source,Status,Created At\n';
      const rows = leads.map((l) =>
        `"${l.id}","${(l.property?.title || '').replace(/"/g, '""')}","${l.name}","${l.email}","${l.phone}","${l.source}","${l.status}","${l.createdAt.toISOString()}"`
      ).join('\n');
      return header + rows;
    }

    // Revenue
    const payments = await prisma.payment.findMany({
      take: 500,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } } },
    });

    const header = 'ID,User Name,User Email,Amount,Currency,Purpose,Status,Date\n';
    const rows = payments.map((pay) =>
      `"${pay.id}","${pay.user?.name || ''}","${pay.user?.email || ''}",${pay.amount},"${pay.currency}","${pay.purpose}","${pay.status}","${pay.createdAt.toISOString()}"`
    ).join('\n');
    return header + rows;
  }
}

export const adminService = new AdminService();
