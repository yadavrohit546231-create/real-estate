import { prisma } from '../../config/database';

export class NotificationsService {
  async getNotifications(userId: string) {
    const [notifications, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      prisma.notification.count({
        where: { userId, isRead: false },
      }),
    ]);

    return { notifications, unreadCount };
  }

  async markAsRead(userId: string, notificationId: string) {
    return prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: string) {
    return prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async registerPushToken(userId: string, token: string, deviceType: string = 'expo') {
    return prisma.notificationToken.upsert({
      where: { token },
      update: { userId, deviceType },
      create: { userId, token, deviceType },
    });
  }
}

export const notificationsService = new NotificationsService();
