import * as service from "../services/comment.service.js";

export const addComment = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "content is required" });
    const comment = await service.addCommentService(req.user.userId, req.params.articleId, content);
    res.status(201).json({ message: "Comment added", comment });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const data = await service.getCommentsService(req.params.articleId, page, limit);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteComment = async (req, res) => {
  try {
    await service.deleteCommentService(req.user.userId, req.params.commentId, req.user.role);
    res.status(200).json({ message: "Comment deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
