import { prisma } from '../../config/database';

export class FavoritesService {
  async getFavorites(userId: string) {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        property: {
          include: {
            images: { take: 1 },
            owner: { select: { id: true, name: true } },
          },
        },
      },
    });
    return favorites.map((f) => f.property);
  }

  async addFavorite(userId: string, propertyId: string) {
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
