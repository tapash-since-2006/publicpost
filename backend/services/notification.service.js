import prisma from "../prisma/client.js";
import redisClient from "../config/redis.js";

// Safe publish — never crashes the main flow if Redis pub/sub fails
const safePublish = async (channel, data) => {
  try {
    await redisClient.publish(channel, JSON.stringify(data));
  } catch (err) {
    console.error(`Redis publish failed for ${channel}:`, err.message);
    // Don't throw — notification is saved to DB, SSE is best-effort
  }
};

// ─── Create a notification ────────────────────────────────────────────────────
export const createNotification = async (userId, type, message, metadata = null) => {
  const notification = await prisma.notification.create({
    data: { userId, type, message, metadata },
  });
  await safePublish(`notifications:${userId}`, notification);
  return notification;
};

// ─── Bulk notify ──────────────────────────────────────────────────────────────
export const notifyMany = async (userIds, type, message, metadata = null) => {
  if (!userIds.length) return;
  await prisma.notification.createMany({
    data: userIds.map((userId) => ({ userId, type, message, metadata })),
  });
  for (const uid of userIds) {
    await safePublish(`notifications:${uid}`, { userId: uid, type, message, metadata });
  }
};

// ─── Get notifications for a user ────────────────────────────────────────────
export const getUserNotificationsService = async (userId, page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where: { userId } }),
    prisma.notification.count({ where: { userId, read: false } }),
  ]);
  return { data: notifications, pagination: { page, limit, total }, unreadCount };
};

// ─── Mark specific notifications as read ─────────────────────────────────────
export const markNotificationsReadService = async (userId, notificationIds) => {
  await prisma.notification.updateMany({
    where: { id: { in: notificationIds }, userId },
    data: { read: true },
  });
};

// ─── Mark ALL as read ────────────────────────────────────────────────────────
export const markAllNotificationsReadService = async (userId) => {
  await prisma.notification.updateMany({
    where: { userId, read: false },
    data: { read: true },
  });
};

// ─── Delete a notification ────────────────────────────────────────────────────
export const deleteNotificationService = async (userId, notificationId) => {
  const notification = await prisma.notification.findUnique({
    where: { id: notificationId },
  });
  if (!notification || notification.userId !== userId) {
    throw new Error("Notification not found");
  }
  await prisma.notification.delete({ where: { id: notificationId } });
};
