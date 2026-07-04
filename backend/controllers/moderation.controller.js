import * as service from "../services/moderation.service.js";

export const flagArticle = async (req, res) => {
  try {
    const { reason } = req.body;
    if (!reason) return res.status(400).json({ error: "reason is required" });
    const flag = await service.flagArticleService(req.user.userId, req.params.articleId, reason);
    res.status(201).json({ message: "Article flagged", flag });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getArticleFlags = async (req, res) => {
  try {
    const data = await service.getArticleFlagsService(req.params.articleId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getFlaggedArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await service.getFlaggedArticlesService(page, limit);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const takeDownArticle = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await service.takeDownArticleService(
      req.user.userId,
      req.params.articleId,
      reason
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const restoreArticle = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await service.restoreArticleService(
      req.user.userId,
      req.params.articleId,
      reason
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const warnJournalist = async (req, res) => {
  try {
    const { reason } = req.body;
    const result = await service.warnJournalistService(
      req.user.userId,
      req.params.journalistId,
      reason
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getModerationLog = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await service.getModerationLogService(page);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
