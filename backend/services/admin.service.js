import prisma from "../prisma/client.js";
import { createNotification } from "./notification.service.js";
import { adjustCredibility } from "./credibility.service.js";

// ─── Default quiz questions (used for seeding) ────────────────────────────────
export const DEFAULT_QUIZ_QUESTIONS = [
  "Government should prioritize equality of outcomes over individual liberty.",
  "Free markets generally produce better outcomes than government regulation.",
  "Immigration benefits the country more than it harms it.",
  "Climate change requires immediate and significant government intervention.",
  "Individual rights should take precedence over collective welfare.",
  "Traditional institutions and values are important for social stability.",
];

// ─── Get quiz questions ───────────────────────────────────────────────────────
export const getQuizQuestionsService = async () => {
  const questions = await prisma.quizQuestion.findMany({
    where: { active: true },
    orderBy: { orderIdx: "asc" },
  });

  // If no questions in DB, seed defaults and return them
  if (questions.length === 0) {
    await prisma.quizQuestion.createMany({
      data: DEFAULT_QUIZ_QUESTIONS.map((text, i) => ({
        text,
        orderIdx: i,
        active: true,
      })),
    });
    return await prisma.quizQuestion.findMany({
      where: { active: true },
      orderBy: { orderIdx: "asc" },
    });
  }
  return questions;
};

// ─── Update quiz questions (admin) ────────────────────────────────────────────
export const updateQuizQuestionsService = async (questions) => {
  if (!Array.isArray(questions) || questions.length !== 6) {
    throw new Error("Exactly 6 quiz questions are required");
  }
  for (const q of questions) {
    if (!q || typeof q !== "string" || q.trim().length < 10) {
      throw new Error("Each question must be at least 10 characters");
    }
  }

  // Delete all existing and recreate
  await prisma.quizQuestion.deleteMany({});
  await prisma.quizQuestion.createMany({
    data: questions.map((text, i) => ({
      text: text.trim(),
      orderIdx: i,
      active: true,
    })),
  });

  return await prisma.quizQuestion.findMany({
    where: { active: true },
    orderBy: { orderIdx: "asc" },
  });
};

// ─── Platform Stats ───────────────────────────────────────────────────────────
export const getPlatformStatsService = async () => {
  const [users, journalists, articles, factChecks, tips] = await Promise.all([
    prisma.user.count(),
    prisma.journalistProfile.count({ where: { verified: true } }),
    // FIX: use _count: { _all: true } for proper groupBy count
    prisma.article.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.factCheck.count(),
    prisma.tip.aggregate({ _sum: { amount: true }, _count: true }),
  ]);

  return {
    totalUsers: users,
    verifiedJournalists: journalists,
    // FIX: use _count._all (not _count directly)
    articles: Object.fromEntries(articles.map((a) => [a.status, a._count._all])),
    totalFactChecks: factChecks,
    totalTips: { count: tips._count, amount: tips._sum.amount ?? 0 },
  };
};

// ─── Journalist Services ──────────────────────────────────────────────────────
export const getPendingJournalistsService = async () => {
  return await prisma.journalistProfile.findMany({
    where: { verified: false },
    include: {
      user: { select: { id: true, name: true, email: true, house: true, createdAt: true } },
      documents: true,
    },
    orderBy: { createdAt: "asc" },
  });
};

export const approveJournalistService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    include: { user: true },
  });
  if (!journalist) throw new Error("Journalist not found");
  if (journalist.verified) throw new Error("Journalist already verified");

  await prisma.$transaction([
    prisma.journalistProfile.update({
      where: { id: journalistId },
      data: { verified: true, credibilityScore: 20 },
    }),
    prisma.user.update({
      where: { id: journalist.userId },
      data: { house: "JOURNALIST" },
    }),
  ]);

  await createNotification(
    journalist.userId,
    "JOURNALIST_APPROVED",
    "🎉 Congratulations! Your journalist application has been approved. You can now publish articles.",
    { journalistId }
  );

  return { message: "Journalist approved", journalistId };
};

export const rejectJournalistService = async (journalistId) => {
  const journalist = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    include: { user: true },
  });
  if (!journalist) throw new Error("Journalist not found");

  await createNotification(
    journalist.userId,
    "JOURNALIST_REJECTED",
    "Your journalist application was not approved at this time. You may reapply.",
    { journalistId }
  );

  await prisma.journalistProfile.delete({ where: { id: journalistId } });
  return { message: "Journalist rejected" };
};

// ─── Article Review Services ──────────────────────────────────────────────────
export const getPendingArticlesService = async () => {
  return await prisma.article.findMany({
    where: { status: "UNDER_REVIEW" },
    orderBy: { createdAt: "asc" },
    include: {
      author: {
        include: { user: { select: { id: true, name: true, email: true, house: true } } },
      },
      tags: true, media: true, factChecks: true,
    },
  });
};

export const approveArticleService = async (articleId, adminId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: "PUBLISHED" },
  });

  await prisma.moderationLog.create({
    data: { adminId, action: "RESTORE", targetId: articleId, reason: "Article approved and published by admin" },
  });

  await adjustCredibility(article.authorId, +3, "Article approved by admin");

  await createNotification(
    article.author.userId,
    "ARTICLE_PUBLISHED",
    `Your article "${article.title}" has been approved and published ✅`,
    { articleId }
  );

  const subscribers = await prisma.subscription.findMany({
    where: { journalistId: article.authorId, status: "ACTIVE" },
    select: { subscriberId: true },
  });
  for (const sub of subscribers) {
    await createNotification(
      sub.subscriberId,
      "ARTICLE_PUBLISHED",
      `${article.author.user.name} published a new article: "${article.title}"`,
      { articleId }
    );
  }

  return updated;
};

export const rejectArticleService = async (articleId, adminId, reason = "Does not meet publishing standards") => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: "REJECTED" },
  });

  await prisma.moderationLog.create({
    data: { adminId, action: "TAKE_DOWN", targetId: articleId, reason },
  });

  await adjustCredibility(article.authorId, -5, `Article rejected: ${reason}`);

  await createNotification(
    article.author.userId,
    "ARTICLE_REJECTED",
    `Your article "${article.title}" was rejected. Reason: ${reason}`,
    { articleId, reason }
  );

  return updated;
};

export const requestCorrectionService = async (articleId, adminId, reason) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");

  const updated = await prisma.article.update({
    where: { id: articleId },
    data: { status: "CORRECTED" },
  });

  await prisma.moderationLog.create({
    data: { adminId, action: "WARN", targetId: articleId, reason },
  });

  await createNotification(
    article.author.userId,
    "MODERATION_ACTION",
    `Your article "${article.title}" needs corrections: ${reason}`,
    { articleId, reason }
  );

  return updated;
};
