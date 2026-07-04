import prisma from "../prisma/client.js";
import { getCache, setCache } from "../config/redis.js";

const OPPOSING_MAP = {
  LEFT:         ["RIGHT", "CENTER_RIGHT"],
  CENTER_LEFT:  ["RIGHT", "CENTER_RIGHT"],
  CENTER:       ["LEFT", "RIGHT"],
  CENTER_RIGHT: ["LEFT", "CENTER_LEFT"],
  RIGHT:        ["LEFT", "CENTER_LEFT"],
};

export const getSideBySideService = async (articleId) => {
  const cacheKey = `comparison:${articleId}`;
  const cached = await getCache(cacheKey);
  if (cached) return cached;

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: {
        include: { user: { select: { id: true, name: true, politicalLeaning: true } } },
      },
      factChecks: true,
      tags: true,
      media: true,
    },
  });
  if (!article) throw new Error("Article not found");
  if (article.status !== "PUBLISHED") throw new Error("Comparison only available for published articles");

  const authorLeaning = article.author.user.politicalLeaning;
  const opposingLeanings = OPPOSING_MAP[authorLeaning] ?? ["CENTER"];
  const tagNames = article.tags.map((t) => t.name);

  // Try with tag match first, then without
  let opposing = null;
  if (tagNames.length > 0) {
    opposing = await prisma.article.findFirst({
      where: {
        id: { not: articleId },
        status: "PUBLISHED",
        author: {
          user: { politicalLeaning: { in: opposingLeanings } },
        },
        tags: { some: { name: { in: tagNames } } },
      },
      include: {
        author: { include: { user: { select: { id: true, name: true, politicalLeaning: true } } } },
        factChecks: true,
        tags: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  // Fallback: any opposing-leaning article even without tag match
  if (!opposing) {
    opposing = await prisma.article.findFirst({
      where: {
        id: { not: articleId },
        status: "PUBLISHED",
        author: {
          user: { politicalLeaning: { in: opposingLeanings } },
        },
      },
      include: {
        author: { include: { user: { select: { id: true, name: true, politicalLeaning: true } } } },
        factChecks: true,
        tags: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
    });
  }

  const result = {
    original: { ...article, authorLeaning },
    opposing: opposing
      ? { ...opposing, authorLeaning: opposing.author.user.politicalLeaning }
      : null,
    message: opposing ? null : "No opposing article found yet. Check back as more articles are published.",
    factOverview: buildFactOverview(article, opposing),
  };

  // Only cache if we found an opposing article
  if (opposing) await setCache(cacheKey, result, 600);
  return result;
};

const buildFactOverview = (a, b) => {
  const summary = (article) => {
    if (!article) return null;
    const checks = article.factChecks ?? [];
    const approved = checks.filter((c) => c.status === "APPROVED").length;
    const rejected = checks.filter((c) => c.status === "REJECTED").length;
    const avgConfidence =
      checks.length > 0
        ? checks.reduce((sum, c) => sum + (c.confidence ?? 0), 0) / checks.length
        : null;
    return { totalChecks: checks.length, approved, rejected, avgConfidence };
  };
  return { original: summary(a), opposing: summary(b) };
};
