import * as service from "../services/factcheck.service.js";

export const getUnverifiedArticles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await service.getUnverifiedArticlesService(page, limit);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const submitFactCheck = async (req, res) => {
  try {
    const { verdict, evidence, confidence, reviewNotes } = req.body;
    if (!verdict || !evidence) {
      return res.status(400).json({ error: "verdict and evidence are required" });
    }
    const result = await service.submitFactCheckService(
      req.user.userId,
      req.params.articleId,
      { verdict, evidence, confidence, reviewNotes }
    );
    res.status(201).json({ message: "Fact check submitted", factCheck: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getArticleFactChecks = async (req, res) => {
  try {
    const data = await service.getArticleFactChecksService(req.params.articleId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
