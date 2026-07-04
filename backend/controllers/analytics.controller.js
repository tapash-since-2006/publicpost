import * as service from "../services/analytics.service.js";

// Record a view (called internally from article controller)
export const recordView = async (req, res) => {
  try {
    const userId = req.user?.userId ?? null;
    const ip = req.ip ?? req.headers["x-forwarded-for"] ?? null;
    const ua = req.headers["user-agent"] ?? null;
    await service.recordViewService(req.params.articleId, userId, ip, ua);
    res.status(200).json({ recorded: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/analytics/me — journalist's full dashboard
export const getMyAnalytics = async (req, res) => {
  try {
    const data = await service.getJournalistAnalyticsService(req.user.userId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/analytics/article/:articleId — single article breakdown
export const getArticleAnalytics = async (req, res) => {
  try {
    const data = await service.getArticleAnalyticsService(req.user.userId, req.params.articleId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET /api/analytics/platform — admin only
export const getPlatformAnalytics = async (req, res) => {
  try {
    const data = await service.getPlatformAnalyticsService();
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
