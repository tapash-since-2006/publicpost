import * as service from "../services/subscription.service.js";

export const subscribe = async (req, res) => {
  try {
    const { tier } = req.body;
    const result = await service.subscribeService(
      req.user.userId,
      req.params.journalistId,
      tier
    );
    res.status(201).json({ message: "Subscribed successfully", subscription: result });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const unsubscribe = async (req, res) => {
  try {
    await service.unsubscribeService(req.user.userId, req.params.journalistId);
    res.status(200).json({ message: "Unsubscribed successfully" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getMySubscriptions = async (req, res) => {
  try {
    const data = await service.getMySubscriptionsService(req.user.userId);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getMySubscribers = async (req, res) => {
  try {
    const data = await service.getJournalistSubscribersService(req.user.userId);
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const data = await service.getSubscriptionFeedService(req.user.userId, page, limit);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
