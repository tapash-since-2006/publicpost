import prisma from "../prisma/client.js";
import { createNotification } from "./notification.service.js";

export const subscribeService = async (subscriberId, journalistId, tier = "FREE") => {
  // BUG FIX: journalistId here is the JournalistProfile.id not User.id
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    include: { user: true },
  });
  if (!journalist) throw new Error("Journalist not found");
  if (!journalist.verified) throw new Error("Can only subscribe to verified journalists");

  // BUG FIX: prevent subscribing to yourself
  if (journalist.userId === subscriberId) throw new Error("Cannot subscribe to yourself");

  const existing = await prisma.subscription.findUnique({
    where: { subscriberId_journalistId: { subscriberId, journalistId } },
  });

  if (existing) {
    if (existing.status === "ACTIVE") throw new Error("Already subscribed to this journalist");
    // Reactivate cancelled subscription
    const updated = await prisma.subscription.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", tier },
    });
    return { ...updated, message: "Resubscribed successfully" };
  }

  const subscription = await prisma.subscription.create({
    data: { subscriberId, journalistId, tier, status: "ACTIVE" },
  });

  await createNotification(
    journalist.userId,
    "SUBSCRIPTION_NEW",
    `You have a new subscriber! 🎉`,
    { subscriberId }
  );

  return subscription;
};

export const unsubscribeService = async (subscriberId, journalistId) => {
  const existing = await prisma.subscription.findUnique({
    where: { subscriberId_journalistId: { subscriberId, journalistId } },
  });
  if (!existing || existing.status !== "ACTIVE") throw new Error("You are not subscribed to this journalist");

  return await prisma.subscription.update({
    where: { id: existing.id },
    data: { status: "CANCELED" },
  });
};

export const getMySubscriptionsService = async (userId) => {
  return await prisma.subscription.findMany({
    where: { subscriberId: userId, status: "ACTIVE" },
    include: {
      journalist: {
        include: { user: { select: { id: true, name: true } } },
      },
    },
    orderBy: { createdAt: "desc" },
  });
};

export const getJournalistSubscribersService = async (userId) => {
  const journalist = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!journalist) throw new Error("Journalist profile not found");

  const [subscribers, total] = await Promise.all([
    prisma.subscription.findMany({
      where: { journalistId: journalist.id, status: "ACTIVE" },
      include: { subscriber: { select: { id: true, name: true, createdAt: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.subscription.count({ where: { journalistId: journalist.id, status: "ACTIVE" } }),
  ]);

  return { subscribers, total };
};

export const getSubscriptionFeedService = async (userId, page = 1, limit = 10) => {
  const subscriptions = await prisma.subscription.findMany({
    where: { subscriberId: userId, status: "ACTIVE" },
    select: { journalistId: true },
  });

  const journalistIds = subscriptions.map((s) => s.journalistId);
  if (!journalistIds.length) {
    return { data: [], pagination: { page, limit, total: 0 }, message: "Subscribe to journalists to see their articles here" };
  }

  const skip = (page - 1) * limit;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { authorId: { in: journalistIds }, status: "PUBLISHED" },
      include: {
        author: { include: { user: { select: { id: true, name: true } } } },
        tags: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.article.count({
      where: { authorId: { in: journalistIds }, status: "PUBLISHED" },
    }),
  ]);

  return { data: articles, pagination: { page, limit, total } };
};
