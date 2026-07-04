import * as service from "../services/article.service.js";
import { recordViewService } from "../services/analytics.service.js";

export const getLatestArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await service.getLatestArticlesService(page, limit);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getArticleById = async (req, res) => {
  try {
    const article = await service.getArticleByIdService(req.params.articleId);
    const userId = req.user?.userId ?? null;
    const ip = req.ip ?? req.headers["x-forwarded-for"] ?? null;
    const ua = req.headers["user-agent"] ?? null;
    recordViewService(req.params.articleId, userId, ip, ua).catch(() => {});
    res.status(200).json(article);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

export const getJournalistArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const articles = await service.getJournalistArticlesService(req.params.journalistId, page);
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchArticles = async (req, res) => {
  try {
    const articles = await service.searchArticlesService(req.query);
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createArticle = async (req, res) => {
  try {
    const submitFlag = req.body.submit === "true" || req.body.submit === true;
    const article = await service.createArticleService(
      req.user.userId,
      { ...req.body, submit: submitFlag },
      req.files || [],
      req.body.tags,
    );
    const message = submitFlag ? "Article submitted for review" : "Draft saved";
    // BUG FIX: return full article object so Postman can auto-save articleId
    res.status(201).json({ message, article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const updateDraftArticle = async (req, res) => {
  try {
    const submitFlag = req.body.submit === "true" || req.body.submit === true;
    const result = await service.updateDraftArticleService(
      req.user.userId,
      req.params.articleId,
      { ...req.body, submit: submitFlag },
      req.files || [],
      req.body.tags,
    );
    res.status(200).json({
      message: result === "submitted" ? "Article submitted for review" : "Draft updated",
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const submitDraftArticle = async (req, res) => {
  try {
    await service.submitDraftArticleService(req.user.userId, req.params.articleId);
    res.status(200).json({ message: "Article submitted for review" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getMyDashboardArticles = async (req, res) => {
  try {
    const articles = await service.getMyDashboardArticlesService(req.user.userId);
    res.status(200).json(articles);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
