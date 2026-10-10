import { prisma } from '../../config/database.js';

export async function createNotification(params: {
  userId: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'PRESCRIPTION' | 'LAB_REPORT' | 'BILLING' | 'SYSTEM';
  linkUrl?: string;
}) {
  try {
    return await prisma.notification.create({
      data: {
        userId: params.userId,
        title: params.title,
        message: params.message,
        type: params.type,
        linkUrl: params.linkUrl,
      },
    });
  } catch (error) {
    console.error('[NOTIFICATION_ERROR] Failed to dispatch notification:', error);
  }
}
