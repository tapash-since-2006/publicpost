import prisma from "../prisma/client.js";
import { createNotification, notifyMany } from "./notification.service.js";
import { adjustCredibility } from "./credibility.service.js";

export const flagArticleService = async (userId, articleId, reason) => {
  const validReasons = ["INCORRECT_FACT", "MISLEADING", "BIAS", "HATE_SPEECH"];
  if (!validReasons.includes(reason)) {
    throw new Error(`reason must be one of: ${validReasons.join(", ")}`);
  }

  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");
  if (article.status !== "PUBLISHED") throw new Error("Can only flag published articles");

  const existing = await prisma.flag.findUnique({
    where: { articleId_userId: { articleId, userId } },
  });
  if (existing) throw new Error("You have already flagged this article");

  const flag = await prisma.flag.create({
    data: { userId, articleId, reason },
  });

  const flagCount = await prisma.flag.count({ where: { articleId } });
  if (flagCount >= 5) {
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "UNDER_REVIEW" },
    });
  }

  return { flag, totalFlags: flagCount };
};

export const getArticleFlagsService = async (articleId) => {
  return await prisma.flag.findMany({
    where: { articleId },
    include: { user: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
  });
};

export const getFlaggedArticlesService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { flags: { some: {} } },
      include: {
        author: { include: { user: { select: { id: true, name: true } } } },
        flags: { include: { user: { select: { id: true, name: true } } } },
        tags: true,
        _count: { select: { flags: true } },
      },
      orderBy: { createdAt: "desc" },
      skip, take: limit,
    }),
    prisma.article.count({ where: { flags: { some: {} } } }),
  ]);
  return { data: articles, pagination: { page, limit, total } };
};

export const takeDownArticleService = async (adminId, articleId, reason) => {
  if (!reason?.trim()) throw new Error("reason is required for takedown");

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");

  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { status: "REJECTED" } }),
    prisma.moderationLog.create({
      data: { adminId, action: "TAKE_DOWN", targetId: articleId, reason },
    }),
  ]);

  await adjustCredibility(article.authorId, -15, `Article taken down: ${reason}`);

  await createNotification(
    article.author.userId,
    "MODERATION_ACTION",
    `Your article "${article.title}" has been taken down. Reason: ${reason}`,
    { articleId }
  );

  const subscribers = await prisma.subscription.findMany({
    where: { journalistId: article.authorId, status: "ACTIVE" },
    select: { subscriberId: true },
  });
  if (subscribers.length) {
    await notifyMany(
      subscribers.map((s) => s.subscriberId),
      "MODERATION_ACTION",
      `An article by ${article.author.user.name} has been removed by moderation`,
      { articleId }
    );
  }

  return { message: "Article taken down", articleId };
};

export const restoreArticleService = async (adminId, articleId, reason) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");

  await prisma.$transaction([
    prisma.article.update({ where: { id: articleId }, data: { status: "PUBLISHED" } }),
    prisma.moderationLog.create({
      data: { adminId, action: "RESTORE", targetId: articleId, reason: reason || "Restored by admin" },
    }),
  ]);

  await createNotification(
    article.author.userId,
    "MODERATION_ACTION",
    `Your article "${article.title}" has been restored ✅`,
    { articleId }
  );

  return { message: "Article restored", articleId };
};

export const warnJournalistService = async (adminId, journalistId, reason) => {
  if (!reason?.trim()) throw new Error("reason is required for warning");

  // FIX: fetch journalist profile to get userId for notification
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    include: { user: true },
  });
  if (!journalist) throw new Error("Journalist not found");

  await prisma.moderationLog.create({
    data: { adminId, action: "WARN", targetId: journalistId, reason },
  });

  await adjustCredibility(journalistId, -5, `Warning issued: ${reason}`);

  // FIX: use journalist.userId for notification (was using journalistId before)
  await createNotification(
    journalist.userId,
    "MODERATION_ACTION",
    `You have received an official warning: ${reason}`,
    { reason }
  );

  return { message: "Journalist warned", journalistId };
};

export const getModerationLogService = async (page = 1, limit = 20) => {
  const skip = (page - 1) * limit;
  const [logs, total] = await Promise.all([
    prisma.moderationLog.findMany({
      orderBy: { createdAt: "desc" },
      skip, take: limit,
    }),
    prisma.moderationLog.count(),
  ]);
  return { data: logs, pagination: { page, limit, total } };
};
