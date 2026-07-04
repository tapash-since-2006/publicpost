import * as service from "../services/reward.service.js";

export const sendTip = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: "Valid amount is required" });
    }
    const result = await service.sendTipService(
      req.user.userId,
      req.params.articleId,
      parseFloat(amount)
    );
    res.status(201).json({ message: "Tip sent successfully", ...result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getArticleTips = async (req, res) => {
  try {
    const data = await service.getArticleTipsService(req.params.articleId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMyEarnings = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await service.getJournalistEarningsService(req.user.userId, page);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
