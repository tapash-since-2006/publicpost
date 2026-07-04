import * as service from "../services/admin.service.js";

export const getPlatformStats = async (req, res) => {
  try {
    const stats = await service.getPlatformStatsService();
    res.status(200).json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getPendingJournalists = async (req, res) => {
  try {
    const pending = await service.getPendingJournalistsService();
    res.status(200).json(pending);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveJournalist = async (req, res) => {
  try {
    const result = await service.approveJournalistService(req.params.journalistId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectJournalist = async (req, res) => {
  try {
    const result = await service.rejectJournalistService(req.params.journalistId);
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getPendingArticles = async (req, res) => {
  try {
    const articles = await service.getPendingArticlesService();
    res.status(200).json(articles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const approveArticle = async (req, res) => {
  try {
    const article = await service.approveArticleService(req.params.articleId, req.user.userId);
    res.status(200).json({ message: "Article approved and published", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const rejectArticle = async (req, res) => {
  try {
    const article = await service.rejectArticleService(
      req.params.articleId, req.user.userId, req.body.reason
    );
    res.status(200).json({ message: "Article rejected", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const requestCorrection = async (req, res) => {
  try {
    const article = await service.requestCorrectionService(
      req.params.articleId, req.user.userId, req.body.reason
    );
    res.status(200).json({ message: "Correction requested", article });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getQuizQuestions = async (req, res) => {
  try {
    const questions = await service.getQuizQuestionsService();
    res.status(200).json(questions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateQuizQuestions = async (req, res) => {
  try {
    const { questions } = req.body;
    const updated = await service.updateQuizQuestionsService(questions);
    res.status(200).json({ message: "Quiz questions updated", questions: updated });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
