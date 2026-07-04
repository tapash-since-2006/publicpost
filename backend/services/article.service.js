import prisma from "../prisma/client.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";
import { triggerAIFactCheck } from "../utils/aiPipeline.js";

const parseTags = (tagsInput) => {
  if (!tagsInput) return [];
  if (Array.isArray(tagsInput)) return tagsInput.filter(Boolean);
  try { return JSON.parse(tagsInput); } catch { return [tagsInput]; }
};

const getMediaType = (result, file) => {
  if (file.mimetype === "application/pdf") return "PDF";
  if (result.resource_type === "video") return "VIDEO";
  return "IMAGE";
};

// Shared author include shape used by all article queries
const authorInclude = {
  include: {
    user: {
      select: { id: true, name: true, politicalLeaning: true },
    },
  },
};

// ─── Create Article ───────────────────────────────────────────────────────────
export const createArticleService = async (userId, { title, content, submit }, files = [], tagsInput) => {
  if (!title?.trim()) throw new Error("title is required");
  if (!content?.trim()) throw new Error("content is required");

  const journalist = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!journalist) throw new Error("Journalist profile not found. Please apply and get approved first.");
  if (!journalist.verified) throw new Error("Your journalist application is pending approval. You cannot publish yet.");

  const shouldSubmit = submit === true || submit === "true";
  const tags = parseTags(tagsInput);

  const media = [];
  for (const file of files) {
    const uploaded = await uploadToCloudinary(file, "articles");
    media.push({ type: getMediaType(uploaded, file), url: uploaded.secure_url });
  }

  const article = await prisma.$transaction(async (tx) => {
    const created = await tx.article.create({
      data: {
        title: title.trim(),
        content: content.trim(),
        authorId: journalist.id,
        status: shouldSubmit ? "UNDER_REVIEW" : "DRAFT",
        tags: {
          connectOrCreate: tags.map((t) => ({
            where: { name: t.trim() },
            create: { name: t.trim() },
          })),
        },
      },
      include: {
        tags: true,
        media: true,
        author: authorInclude,
      },
    });

    if (media.length) {
      await tx.articleMedia.createMany({
        data: media.map((m) => ({ ...m, articleId: created.id })),
      });
    }
    return created;
  });

  if (shouldSubmit) triggerAIFactCheck(article.id).catch(console.error);
  return article;
};

// ─── Update Draft ─────────────────────────────────────────────────────────────
export const updateDraftArticleService = async (userId, articleId, { title, content, submit }, files = [], tagsInput) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true },
  });
  if (!article) throw new Error("Article not found");
  if (article.author.userId !== userId) throw new Error("Not authorized to edit this article");
  if (!["DRAFT", "CORRECTED"].includes(article.status)) {
    throw new Error(`Cannot edit article with status: ${article.status}`);
  }

  const shouldSubmit = submit === true || submit === "true";
  const tags = parseTags(tagsInput);

  await prisma.article.update({
    where: { id: articleId },
    data: {
      title: title?.trim() ?? article.title,
      content: content?.trim() ?? article.content,
      status: shouldSubmit ? "UNDER_REVIEW" : article.status,
      ...(tags.length > 0 && {
        tags: {
          set: [],
          connectOrCreate: tags.map((t) => ({
            where: { name: t.trim() },
            create: { name: t.trim() },
          })),
        },
      }),
    },
  });

  if (files.length) {
    await prisma.articleMedia.deleteMany({ where: { articleId } });
    for (const file of files) {
      const uploaded = await uploadToCloudinary(file, "articles");
      await prisma.articleMedia.create({
        data: { articleId, type: getMediaType(uploaded, file), url: uploaded.secure_url },
      });
    }
  }

  if (shouldSubmit) triggerAIFactCheck(articleId).catch(console.error);
  return shouldSubmit ? "submitted" : "updated";
};

// ─── Submit Draft ─────────────────────────────────────────────────────────────
export const submitDraftArticleService = async (userId, articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: { author: true },
  });
  if (!article) throw new Error("Article not found");
  if (article.author.userId !== userId) throw new Error("Not authorized");
  if (!["DRAFT", "CORRECTED"].includes(article.status)) {
    throw new Error(`Cannot submit article with status: ${article.status}`);
  }
  await prisma.article.update({ where: { id: articleId }, data: { status: "UNDER_REVIEW" } });
  triggerAIFactCheck(articleId).catch(console.error);
  return { message: "Article submitted for review" };
};

// ─── Get Latest Published ─────────────────────────────────────────────────────
export const getLatestArticlesService = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { status: "PUBLISHED" },
      include: {
        author: authorInclude,
        media: true,
        tags: true,
        _count: { select: { comments: true, tips: true, views: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.article.count({ where: { status: "PUBLISHED" } }),
  ]);
  return { data: articles, pagination: { page, limit, total } };
};

// ─── Get Article By ID ────────────────────────────────────────────────────────
export const getArticleByIdService = async (articleId) => {
  const article = await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: authorInclude,
      media: true,
      tags: true,
      comments: {
        include: { user: { select: { id: true, name: true } } },
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      factChecks: { orderBy: { createdAt: "desc" } },
      _count: { select: { flags: true, tips: true, views: true } },
    },
  });
  if (!article) throw new Error("Article not found");
  return article;
};

// ─── Get Journalist Articles ──────────────────────────────────────────────────
export const getJournalistArticlesService = async (journalistId, page = 1) => {
  const skip = (page - 1) * 10;
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: { authorId: journalistId, status: "PUBLISHED" },
      include: {
        author: authorInclude,
        media: true,
        tags: true,
        _count: { select: { views: true, comments: true } },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: 10,
    }),
    prisma.article.count({ where: { authorId: journalistId, status: "PUBLISHED" } }),
  ]);
  return { data: articles, pagination: { page, limit: 10, total } };
};

// ─── Search Articles ──────────────────────────────────────────────────────────
export const searchArticlesService = async (query) => {
  const { q, page = 1, limit = 10 } = query;
  if (!q?.trim()) throw new Error("Search query 'q' is required");
  const skip = (Number(page) - 1) * Number(limit);
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
          { tags: { some: { name: { contains: q, mode: "insensitive" } } } },
        ],
      },
      include: {
        author: authorInclude,
        tags: true,
        media: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: Number(limit),
    }),
    prisma.article.count({
      where: {
        status: "PUBLISHED",
        OR: [
          { title: { contains: q, mode: "insensitive" } },
          { content: { contains: q, mode: "insensitive" } },
        ],
      },
    }),
  ]);
  return { data: articles, pagination: { page: Number(page), limit: Number(limit), total } };
};

// ─── Journalist Dashboard ─────────────────────────────────────────────────────
export const getMyDashboardArticlesService = async (userId) => {
  const journalist = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!journalist) throw new Error("Journalist profile not found");

  return await prisma.article.findMany({
    where: { authorId: journalist.id },
    include: {
      media: true,
      tags: true,
      factChecks: { orderBy: { createdAt: "desc" } },
      _count: { select: { views: true, comments: true, tips: true } },
    },
    orderBy: { createdAt: "desc" },
  });
};
