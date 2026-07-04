import * as service from "../services/notification.service.js";

export const getNotifications = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const data = await service.getUserNotificationsService(req.user.userId, page);
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const markRead = async (req, res) => {
  try {
    const { ids } = req.body; // array of notification ids
    if (!Array.isArray(ids) || !ids.length) {
      return res.status(400).json({ error: "ids array required" });
    }
    await service.markNotificationsReadService(req.user.userId, ids);
    res.status(200).json({ message: "Marked as read" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const markAllRead = async (req, res) => {
  try {
    await service.markAllNotificationsReadService(req.user.userId);
    res.status(200).json({ message: "All notifications marked as read" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await service.deleteNotificationService(req.user.userId, req.params.id);
    res.status(200).json({ message: "Notification deleted" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
