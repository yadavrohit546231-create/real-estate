import { prisma } from '../../config/database';
import { PropertyStatus, UserRole } from '@real-estate/types';
import { calculatePagination, maskPhoneNumber } from '@real-estate/shared';

export class PropertiesService {
  async getProperties(query: any, requestingUser?: { userId: string; role: UserRole }) {
    const page = Math.max(1, parseInt(query.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(query.limit || '20', 10)));
    const skip = (page - 1) * limit;

    const where: any = {};

    // By default, public search only returns LIVE properties
    if (!query.status) {
      where.status = PropertyStatus.LIVE;
    } else {
      where.status = query.status;
    }

    // Keyword Search across title, description, locality, city
    if (query.search && query.search.trim() !== '') {
      const s = query.search.trim();
      where.OR = [
        { title: { contains: s } },
        { description: { contains: s } },
        { locality: { contains: s } },
        { city: { contains: s } },
      ];
    }

    if (query.city) {
      where.city = { equals: query.city };
    }

    if (query.locality) {
      where.locality = { contains: query.locality };
    }

    if (query.listingType) {
      where.listingType = query.listingType;
    }

    if (query.category) {
      where.category = query.category;
    }

    if (query.propertyType) {
      where.propertyType = query.propertyType;
    }

    // Price range
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {};
      if (query.minPrice !== undefined) where.price.gte = Number(query.minPrice);
      if (query.maxPrice !== undefined) where.price.lte = Number(query.maxPrice);
    }

    // Area range
    if (query.minArea !== undefined || query.maxArea !== undefined) {
      where.area = {};
      if (query.minArea !== undefined) where.area.gte = Number(query.minArea);
      if (query.maxArea !== undefined) where.area.lte = Number(query.maxArea);
    }

    // Bedrooms
    if (query.bedrooms) {
      const beds = Array.isArray(query.bedrooms)
        ? query.bedrooms.map(Number)
        : [Number(query.bedrooms)];
      where.bedrooms = { in: beds };
    }

    if (query.furnishing) {
      where.furnishing = query.furnishing;
    }

    if (query.isVerified !== undefined) {
      where.isVerified = query.isVerified === 'true' || query.isVerified === true;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured === 'true' || query.isFeatured === true;
    }

    // Sorting
    let orderBy: any = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];
    if (query.sortBy === 'price_asc') orderBy = [{ price: 'asc' }];
    if (query.sortBy === 'price_desc') orderBy = [{ price: 'desc' }];
    if (query.sortBy === 'area_asc') orderBy = [{ area: 'asc' }];
    if (query.sortBy === 'area_desc') orderBy = [{ area: 'desc' }];
    if (query.sortBy === 'newest') orderBy = [{ isFeatured: 'desc' }, { createdAt: 'desc' }];

    const [total, properties] = await Promise.all([
      prisma.property.count({ where }),
      prisma.property.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          amenities: { include: { amenity: true } },
          owner: { select: { id: true, name: true, phone: true } },
        },
      }),
    ]);

    // Mask phone number for public users
    const sanitizedProperties = properties.map((prop) => {
      const isOwnerOrAdmin =
        requestingUser &&
        (requestingUser.role === UserRole.ADMIN ||
          requestingUser.role === UserRole.SUPER_ADMIN ||
          requestingUser.userId === prop.ownerId);

      return {
        ...prop,
        owner: prop.owner
          ? {
              id: prop.owner.id,
              name: prop.owner.name,
              phone: isOwnerOrAdmin ? prop.owner.phone : maskPhoneNumber(prop.owner.phone),
            }
          : null,
      };
    });

    return {
      data: sanitizedProperties,
      pagination: calculatePagination(page, limit, total),
    };
  }

  async getPropertyById(id: string, requestingUser?: { userId: string; role: UserRole }) {
    const property = await prisma.property.findUnique({
      where: { id },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        videos: true,
        amenities: { include: { amenity: true } },
        approvals: { orderBy: { createdAt: 'desc' }, take: 1 },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            avatarUrl: true,
            createdAt: true,
          },
        },
        agent: {
          select: {
            id: true,
            name: true,
            phone: true,
            agentProfile: true,
          },
        },
      },
    });

    if (!property) {
      throw new Error('Property not found');
    }

    const isAuthorized =
      requestingUser &&
      (requestingUser.role === UserRole.ADMIN ||
        requestingUser.role === UserRole.SUPER_ADMIN ||
        requestingUser.userId === property.ownerId ||
        requestingUser.userId === property.agentId);

    // If not LIVE and not owner/admin, block viewing
    if (property.status !== PropertyStatus.LIVE && !isAuthorized) {
      throw new Error('This property listing is currently not active');
    }

    // Mask phone number for general public viewing
    const sanitizedOwner = property.owner
      ? {
          ...property.owner,
          phone: isAuthorized ? property.owner.phone : maskPhoneNumber(property.owner.phone),
          email: isAuthorized ? property.owner.email : undefined,
        }
      : null;

    return {
      ...property,
      owner: sanitizedOwner,
    };
  }

  async createProperty(userId: string, data: any) {
    // Check duplicate listing heuristic: same owner, city, locality, bedrooms, area, price
    const duplicate = await prisma.property.findFirst({
      where: {
        ownerId: userId,
        city: data.city,
        locality: data.locality,
        propertyType: data.propertyType,
        area: data.area,
        price: data.price,
      },
    });

    const status = data.isDraft ? PropertyStatus.DRAFT : PropertyStatus.PENDING_REVIEW;

    const { amenityIds, images, isDraft, ...propertyFields } = data;

    const newProperty = await prisma.property.create({
      data: {
        ...propertyFields,
        ownerId: userId,
        status,
        rejectionReason: duplicate ? '[Duplicate Warning: Matches existing listing parameters]' : null,
        images: images && images.length > 0
          ? {
              create: images.map((img: any, idx: number) => ({
                url: img.url,
                thumbnailUrl: img.thumbnailUrl || img.url,
                sortOrder: img.sortOrder ?? idx,
              })),
            }
          : undefined,
        amenities: amenityIds && amenityIds.length > 0
          ? {
              create: amenityIds.map((amenityId: string) => ({
                amenity: { connect: { id: amenityId } },
              })),
            }
          : undefined,
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    return newProperty;
  }

  async updateProperty(propertyId: string, userId: string, userRole: UserRole, data: any) {
    const existing = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!existing) throw new Error('Property not found');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isAdmin && existing.ownerId !== userId) {
      throw new Error('Forbidden: You are not authorized to edit this property');
    }

    const { amenityIds, images, isDraft, ...updateFields } = data;

    // If owner edits a REJECTED property, it resets to DRAFT or PENDING_REVIEW if submitted
    let nextStatus = existing.status;
    if (existing.status === PropertyStatus.REJECTED && !isDraft) {
      nextStatus = PropertyStatus.PENDING_REVIEW;
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        ...updateFields,
        status: nextStatus,
        rejectionReason: nextStatus === PropertyStatus.PENDING_REVIEW ? null : existing.rejectionReason,
      },
      include: {
        images: true,
        amenities: { include: { amenity: true } },
      },
    });

    return updated;
  }

  async submitProperty(propertyId: string, userId: string) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new Error('Property not found');
    if (property.ownerId !== userId) throw new Error('Unauthorized');

    if (property.status !== PropertyStatus.DRAFT && property.status !== PropertyStatus.REJECTED) {
      throw new Error(`Cannot submit property with status '${property.status}'`);
    }

    const updated = await prisma.property.update({
      where: { id: propertyId },
      data: {
        status: PropertyStatus.PENDING_REVIEW,
        rejectionReason: null,
      },
    });

    return updated;
  }

  async deleteProperty(propertyId: string, userId: string, userRole: UserRole) {
    const property = await prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) throw new Error('Property not found');

    const isAdmin = userRole === UserRole.ADMIN || userRole === UserRole.SUPER_ADMIN;
    if (!isAdmin && property.ownerId !== userId) {
      throw new Error('Unauthorized');
    }

    await prisma.property.update({
      where: { id: propertyId },
      data: { status: PropertyStatus.DELETED },
    });

    return true;
  }
}

export const propertiesService = new PropertiesService();
