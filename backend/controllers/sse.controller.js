import { registerSSEClient, getActiveConnections } from "../services/sse.service.js";

// GET /api/sse/stream
export const streamNotifications = (req, res) => {
  try {
    const userId = req.user.userId;
    registerSSEClient(userId, res);
  } catch (err) {
    res.status(500).json({ error: "Failed to establish SSE connection" });
  }
};

// GET /api/sse/status (admin only)
export const getSSEStatus = (req, res) => {
  res.status(200).json({
    activeConnections: getActiveConnections(),
    timestamp: new Date().toISOString(),
  });
};
