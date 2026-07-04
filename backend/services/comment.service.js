import prisma from "../prisma/client.js";

export const addCommentService = async (userId, articleId, content) => {
  const article = await prisma.article.findUnique({ where: { id: articleId } });
  if (!article) throw new Error("Article not found");
  if (article.status !== "PUBLISHED") throw new Error("Can only comment on published articles");

  if (!content?.trim()) throw new Error("Comment cannot be empty");
  if (content.trim().length > 2000) throw new Error("Comment too long (max 2000 characters)");

  return await prisma.comment.create({
    data: { userId, articleId, content: content.trim() },
    include: { user: { select: { id: true, name: true } } },
  });
};

export const getCommentsService = async (articleId, page = 1, limit = 20) => {
  // BUG FIX: verify article exists first
  const article = await prisma.article.findUnique({ where: { id: articleId }, select: { id: true } });
  if (!article) throw new Error("Article not found");

  const skip = (page - 1) * limit;
  const [comments, total] = await Promise.all([
    prisma.comment.findMany({
      where: { articleId },
      include: { user: { select: { id: true, name: true } } },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.comment.count({ where: { articleId } }),
  ]);
  return { data: comments, pagination: { page, limit, total } };
};

export const deleteCommentService = async (userId, commentId, role) => {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment) throw new Error("Comment not found");
  if (comment.userId !== userId && role !== "ADMIN") {
    throw new Error("Not authorized to delete this comment");
  }
  await prisma.comment.delete({ where: { id: commentId } });
  return { message: "Comment deleted" };
};
