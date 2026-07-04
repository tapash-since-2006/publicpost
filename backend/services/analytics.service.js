import prisma from "../prisma/client.js";
import { getCache, setCache } from "../config/redis.js";

// ─── Record a view ────────────────────────────────────────────────────────────
export const recordViewService = async (articleId, userId = null, ip = null, userAgent = null) => {
  try {
    if (userId || ip) {
      const dedupeKey = `view:${articleId}:${userId ?? ip}`;
      const seen = await getCache(dedupeKey);
      if (seen) return null;
      await setCache(dedupeKey, 1, 3600);
    }
    return await prisma.articleView.create({
      data: { articleId, userId, ip, userAgent },
    });
  } catch (err) {
    // Never crash the article GET request due to analytics failure
    console.error("View tracking error:", err.message);
    return null;
  }
};

// ─── Journalist analytics dashboard ──────────────────────────────────────────
export const getJournalistAnalyticsService = async (userId) => {
  const journalist = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!journalist) throw new Error("Journalist profile not found");

  const articles = await prisma.article.findMany({
    where: { authorId: journalist.id },
    select: { id: true },
  });
  const articleIds = articles.map((a) => a.id);

  if (!articleIds.length) {
    return {
      overview: {
        totalViews: 0, totalArticles: 0, totalTips: 0,
        totalTipAmount: 0, totalEarnings: 0,
        totalSubscribers: 0, credibilityScore: journalist.credibilityScore,
      },
      topArticles: [], viewsOverTime: [], recentActivity: [],
    };
  }

  const [
    totalViews, totalTipsAgg, totalEarnings,
    totalSubscribers, publishedCount, topArticles,
    viewsRaw, recentActivity,
  ] = await Promise.all([
    prisma.articleView.count({ where: { articleId: { in: articleIds } } }),

    prisma.tip.aggregate({
      where: { articleId: { in: articleIds } },
      _sum: { amount: true }, _count: true,
    }),

    prisma.ledgerEntry.aggregate({
      where: { journalistId: journalist.id },
      _sum: { amount: true },
    }),

    prisma.subscription.count({
      where: { journalistId: journalist.id, status: "ACTIVE" },
    }),

    prisma.article.count({
      where: { authorId: journalist.id, status: "PUBLISHED" },
    }),

    prisma.article.findMany({
      where: { authorId: journalist.id, status: "PUBLISHED" },
      select: {
        id: true, title: true, createdAt: true, status: true,
        tags: { select: { name: true } },
        _count: { select: { views: true, comments: true, tips: true } },
      },
      orderBy: { views: { _count: "desc" } },
      take: 5,
    }),

    prisma.articleView.findMany({
      where: {
        articleId: { in: articleIds },
        createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),

    prisma.comment.findMany({
      where: { articleId: { in: articleIds } },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true, content: true, createdAt: true, articleId: true,
        user: { select: { id: true, name: true } },
      },
    }),
  ]);

  // Group views by day
  const byDay = {};
  for (const v of viewsRaw) {
    const day = v.createdAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const viewsOverTime = Object.entries(byDay)
    .map(([date, views]) => ({ date, views }))
    .sort((a, b) => a.date.localeCompare(b.date));

  return {
    overview: {
      totalViews,
      totalArticles: publishedCount,
      totalTips: totalTipsAgg._count,
      totalTipAmount: totalTipsAgg._sum.amount ?? 0,
      totalEarnings: parseFloat((totalEarnings._sum.amount ?? 0).toFixed(2)),
      totalSubscribers,
      credibilityScore: journalist.credibilityScore,
    },
    topArticles,
    viewsOverTime,
    recentActivity,
  };
};

// ─── Single article analytics ─────────────────────────────────────────────────
export const getArticleAnalyticsService = async (userId, articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true },
  });
  if (!article) throw new Error("Article not found");
  if (article.author.userId !== userId) throw new Error("Not authorized to view analytics for this article");

  const cacheKey = `analytics:article:${articleId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [totalViews, totalComments, tipStats, viewsRaw] = await Promise.all([
    prisma.articleView.count({ where: { articleId } }),
    prisma.comment.count({ where: { articleId } }),
    prisma.tip.aggregate({
      where: { articleId },
      _sum: { amount: true }, _count: true,
    }),
    prisma.articleView.findMany({
      where: {
        articleId,
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
      },
      select: { createdAt: true },
    }),
  ]);

  const byDay = {};
  for (const v of viewsRaw) {
    const day = v.createdAt.toISOString().split("T")[0];
    byDay[day] = (byDay[day] || 0) + 1;
  }

  const result = {
    articleId,
    totalViews,
    totalComments,
    totalTips: tipStats._count,
    totalTipAmount: tipStats._sum.amount ?? 0,
    viewsOverTime: Object.entries(byDay)
      .map(([date, views]) => ({ date, views }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };

  await setCache(cacheKey, result, 300);
  return result;
};

// ─── Platform-wide analytics (admin) ─────────────────────────────────────────
export const getPlatformAnalyticsService = async () => {
  const cacheKey = "analytics:platform";
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const [totalUsers, totalJournalists, totalArticles, totalViews, totalTips, topArticles, userGrowthRaw] =
    await Promise.all([
      prisma.user.count(),
      prisma.journalistProfile.count({ where: { verified: true } }),
      prisma.article.count({ where: { status: "PUBLISHED" } }),
      prisma.articleView.count(),
      prisma.tip.aggregate({ _sum: { amount: true }, _count: true }),
      prisma.article.findMany({
        where: { status: "PUBLISHED" },
        select: {
          id: true, title: true,
          _count: { select: { views: true, tips: true, comments: true } },
          author: { include: { user: { select: { name: true } } } },
        },
        orderBy: { views: { _count: "desc" } },
        take: 10,
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } },
        select: { createdAt: true },
      }),
    ]);

  const userGrowthMap = {};
  for (const u of userGrowthRaw) {
    const day = u.createdAt.toISOString().split("T")[0];
    userGrowthMap[day] = (userGrowthMap[day] || 0) + 1;
  }

  const result = {
    totals: {
      users: totalUsers,
      verifiedJournalists: totalJournalists,
      publishedArticles: totalArticles,
      totalViews,
      totalTips: totalTips._count,
      totalTipVolume: totalTips._sum.amount ?? 0,
    },
    topArticles,
    userGrowth: Object.entries(userGrowthMap)
      .map(([date, users]) => ({ date, users }))
      .sort((a, b) => a.date.localeCompare(b.date)),
  };

  await setCache(cacheKey, result, 600);
  return result;
};
