import { createClient } from "redis";
import { REDIS_URL } from "./env.js";

const redisClient = createClient({
  url: REDIS_URL,
  socket: {
    tls: REDIS_URL.startsWith("rediss://"), // enable TLS for Upstash
    rejectUnauthorized: false,
  },
});

redisClient.on("error", (err) => console.error("Redis error:", err));
redisClient.on("connect", () => console.log("✅ Redis connected"));

await redisClient.connect();

export default redisClient;

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const setCache = async (key, value, ttl = 300) => {
  await redisClient.set(key, JSON.stringify(value), { EX: ttl });
};

export const getCache = async (key) => {
  try {
    const data = await redisClient.get(key);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

export const delCache = async (key) => {
  await redisClient.del(key);
};

export const delCachePattern = async (pattern) => {
  try {
    const keys = await redisClient.keys(pattern);
    if (keys.length) await redisClient.del(keys);
  } catch {
    // ignore
  }
};

export const blacklistToken = async (token, ttlSeconds) => {
  await redisClient.set(`bl:${token}`, "1", { EX: ttlSeconds });
};

export const isTokenBlacklisted = async (token) => {
  try {
    const val = await redisClient.get(`bl:${token}`);
    return val !== null;
  } catch {
    return false;
  }
};
