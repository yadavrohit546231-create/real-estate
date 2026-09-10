import { prisma } from '../../config/database';

export class FavoritesService {
  async getFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: { orderBy: { sortOrder: 'asc' } },
            owner: { select: { id: true, name: true, role: true, phone: true } },
            agent: { select: { id: true, name: true, role: true, phone: true } },
          },
        },
      },
    });
    return favorites.map((f) => f.property).filter(Boolean);
  }

  async addFavorite(userId: string, propertyId: string) {
    const property = await prisma.property.findUnique({
      where: { id: propertyId },
      select: { id: true },
    });
    if (!property) throw new Error('Property not found');

    const existing = await prisma.favorite.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });
    if (existing) return existing;

    return prisma.favorite.create({
      data: { userId, propertyId },
    });
  }

  async removeFavorite(userId: string, propertyId: string) {
    return prisma.favorite.deleteMany({
      where: { userId, propertyId },
    });
  }
}

export const favoritesService = new FavoritesService();
