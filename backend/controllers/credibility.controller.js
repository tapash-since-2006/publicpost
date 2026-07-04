import * as service from "../services/credibility.service.js";

export const getCredibility = async (req, res) => {
  try {
    const data = await service.getCredibilityService(req.params.journalistId);
    res.status(200).json(data);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

export const getCredibilityHistory = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await service.getCredibilityHistoryService(req.params.journalistId, page);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLeaderboard = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const data = await service.getCredibilityLeaderboardService(limit);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
