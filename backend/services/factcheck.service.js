import prisma from "../prisma/client.js";
import { adjustCredibility } from "./credibility.service.js";
import { createNotification, notifyMany } from "./notification.service.js";

export const submitFactCheckService = async (reviewerId, articleId, { verdict, evidence, confidence, reviewNotes }) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");

  // BUG FIX: allow UNDER_REVIEW or PUBLISHED (admin may have published but needs re-check)
  if (!["UNDER_REVIEW", "PUBLISHED"].includes(article.status)) {
    throw new Error(`Article status is "${article.status}" — only UNDER_REVIEW articles can be fact-checked`);
  }

  // BUG FIX: prevent duplicate fact checks from same reviewer
  const existingCheck = await prisma.factCheck.findFirst({
    where: { articleId, reviewerId },
  });
  if (existingCheck) throw new Error("You have already submitted a fact check for this article");

  // Map verdict to FactCheckStatus
  const statusMap = {
    APPROVED: "APPROVED",
    REJECTED: "REJECTED",
    FLAGGED: "FLAGGED",
  };
  const status = statusMap[verdict];
  if (!status) throw new Error("verdict must be APPROVED, REJECTED, or FLAGGED");

  const factCheck = await prisma.factCheck.create({
    data: {
      articleId,
      type: "HUMAN",
      status,
      result: { verdict, evidence },
      confidence: confidence ? parseFloat(confidence) : null,
      reviewerId,
      reviewNotes: reviewNotes ?? null,
    },
  });

  // Update article and credibility based on verdict
  if (status === "APPROVED") {
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "PUBLISHED" },
    });

    await adjustCredibility(article.authorId, +5, "Article verified by fact-checker");

    await createNotification(
      article.author.userId,
      "ARTICLE_VERIFIED",
      `Your article "${article.title}" has been verified ✅`,
      { articleId }
    );

    // Notify subscribers
    const subscribers = await prisma.subscription.findMany({
      where: { journalistId: article.authorId, status: "ACTIVE" },
      select: { subscriberId: true },
    });
    if (subscribers.length) {
      await notifyMany(
        subscribers.map((s) => s.subscriberId),
        "ARTICLE_PUBLISHED",
        `${article.author.user.name} published a verified article: "${article.title}"`,
        { articleId }
      );
    }

  } else if (status === "REJECTED") {
    await prisma.article.update({
      where: { id: articleId },
      data: { status: "REJECTED" },
    });

    await adjustCredibility(article.authorId, -10, "Article disputed by fact-checker");

    await createNotification(
      article.author.userId,
      "ARTICLE_DISPUTED",
      `Your article "${article.title}" has been disputed ❌. Evidence: ${evidence}`,
      { articleId }
    );

  } else if (status === "FLAGGED") {
    // Keep under review but notify author
    await createNotification(
      article.author.userId,
      "ARTICLE_DISPUTED",
      `Your article "${article.title}" has been flagged for further review 🚩`,
      { articleId }
    );
  }

  return factCheck;
};

export const getArticleFactChecksService = async (articleId) => {
  return await prisma.factCheck.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
  });
};

export const getUnverifiedArticlesService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "UNDER_REVIEW" },
      include: {
        author: {
          include: { user: { select: { id: true, name: true, politicalLeaning: true } } },
        },
        tags: true,
        factChecks: true,
        media: true,
      },
      orderBy: { createdAt: "asc" },
      skip,
      take: limit,
    }),
    prisma.article.count({ where: { status: "UNDER_REVIEW" } }),
  ]);
  return { data: articles, pagination: { page, limit, total } };
};
