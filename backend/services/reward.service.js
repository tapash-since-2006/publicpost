import prisma from "../prisma/client.js";
import { createNotification } from "./notification.service.js";

export const sendTipService = async (userId, articleId, amount) => {
  if (!amount || isNaN(amount) || amount <= 0) throw new Error("Amount must be greater than 0");

  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: { include: { user: true } } },
  });
  if (!article) throw new Error("Article not found");
  if (article.status !== "PUBLISHED") throw new Error("Can only tip published articles");

  // BUG FIX: prevent tipping your own article
  if (article.author.userId === userId) throw new Error("Cannot tip your own article");

  const PLATFORM_COMMISSION = 0.1;
  const authorEarning = parseFloat((amount * (1 - PLATFORM_COMMISSION)).toFixed(2));
  const commission = parseFloat((amount * PLATFORM_COMMISSION).toFixed(2));

  const [tip] = await prisma.$transaction([
    prisma.tip.create({
      data: { userId, articleId, amount: parseFloat(amount) },
    }),
    prisma.ledgerEntry.create({
      data: {
        journalistId: article.authorId,
        amount: authorEarning,
        type: "TIP",
        referenceId: articleId,
      },
    }),
    prisma.ledgerEntry.create({
      data: {
        journalistId: article.authorId,
        amount: -commission,
        type: "COMMISSION",
        referenceId: articleId,
      },
    }),
  ]);

  await createNotification(
    article.author.userId,
    "TIP_RECEIVED",
    `You received a tip of ₹${amount} on "${article.title}" 💰 (Net: ₹${authorEarning})`,
    { articleId, amount, authorEarning }
  );

  return { tip, authorEarning, commission, message: "Tip sent successfully" };
};

export const getArticleTipsService = async (articleId) => {
  const [tips, total] = await Promise.all([
    prisma.tip.findMany({
      where: { articleId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tip.aggregate({ where: { articleId }, _sum: { amount: true }, _count: true }),
  ]);
  return { tips, totalAmount: total._sum.amount ?? 0, totalCount: total._count };
};

export const getJournalistEarningsService = async (userId, page = 1) => {
  const journalist = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!journalist) throw new Error("Journalist profile not found. You may not be a verified journalist yet.");

  const limit = 20;
  const skip = (page - 1) * limit;
  const [entries, total, netEarnings] = await Promise.all([
    prisma.ledgerEntry.findMany({
      where: { journalistId: journalist.id },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.ledgerEntry.count({ where: { journalistId: journalist.id } }),
    prisma.ledgerEntry.aggregate({
      where: { journalistId: journalist.id },
      _sum: { amount: true },
    }),
  ]);

  return {
    data: entries,
    pagination: { page, limit, total },
    netEarnings: parseFloat((netEarnings._sum.amount ?? 0).toFixed(2)),
  };
};
