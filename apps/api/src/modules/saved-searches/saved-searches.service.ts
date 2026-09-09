import { prisma } from '../../config/database';

export class SavedSearchesService {
  async getSavedSearches(userId: string) {
    const searches = await prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return searches.map((s) => ({
      ...s,
      criteria: JSON.parse(s.criteria),
    }));
  }

  async createSavedSearch(userId: string, data: { name: string; city?: string; criteria: any; notifyEmail?: boolean }) {
    const created = await prisma.savedSearch.create({
      data: {
        userId,
        name: data.name,
        city: data.city,
        criteria: JSON.stringify(data.criteria),
        notifyEmail: data.notifyEmail ?? true,
      },
    });
    return {
      ...created,
      criteria: JSON.parse(created.criteria),
    };
  }

  async deleteSavedSearch(userId: string, id: string) {
    return prisma.savedSearch.deleteMany({
      where: { id, userId },
    });
  }
}

export const savedSearchesService = new SavedSearchesService();
