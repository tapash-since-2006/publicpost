import { createClient } from "redis";
import { REDIS_URL } from "../config/env.js";

// Store active SSE connections: userId → res
const clients = new Map();

// ─── Register a client connection ─────────────────────────────────────────────
export const registerSSEClient = (userId, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  // Send initial connected event
  res.write(`event: connected\ndata: ${JSON.stringify({ userId, timestamp: new Date().toISOString() })}\n\n`);

  clients.set(userId, res);

  // Keep-alive ping every 25s
  const pingInterval = setInterval(() => {
    if (clients.has(userId)) {
      res.write(`: ping\n\n`);
    } else {
      clearInterval(pingInterval);
    }
  }, 25000);

  res.on("close", () => {
    clients.delete(userId);
    clearInterval(pingInterval);
    console.log(`SSE disconnected: ${userId} (active: ${clients.size})`);
  });

  console.log(`SSE connected: ${userId} (active: ${clients.size})`);
};

// ─── Send event to a specific user ───────────────────────────────────────────
export const sendToUser = (userId, eventType, data) => {
  const res = clients.get(userId);
  if (res) {
    res.write(`event: ${eventType}\ndata: ${JSON.stringify(data)}\n\n`);
    return true;
  }
  return false;
};

// ─── Redis subscriber for pub/sub delivery ────────────────────────────────────
let subscriber = null;

export const startSSESubscriber = async () => {
  try {
    subscriber = createClient({
      url: REDIS_URL,
      socket: {
        tls: REDIS_URL.startsWith("rediss://"),
        rejectUnauthorized: false,
        reconnectStrategy: (retries) => {
          if (retries > 5) {
            console.error("SSE Redis subscriber: too many retries, giving up");
            return false;
          }
          return Math.min(retries * 500, 3000);
        },
      },
    });

    subscriber.on("error", (err) => {
      console.error("SSE Redis subscriber error:", err.message);
    });

    await subscriber.connect();

    await subscriber.pSubscribe("notifications:*", (message, channel) => {
      const userId = channel.replace("notifications:", "");
      try {
        const data = JSON.parse(message);
        sendToUser(userId, "notification", data);
      } catch {
        // ignore parse errors
      }
    });

    console.log("✅ SSE Redis subscriber started");
  } catch (err) {
    // Don't crash server if SSE subscriber fails — notifications still saved to DB
    console.error("SSE subscriber failed to start (SSE real-time disabled):", err.message);
  }
};

export const getActiveConnections = () => clients.size;
