import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import prisma from "./prisma/client.js";
import routes from "./routes/index.js";

import "./config/redis.js";
import { startSSESubscriber } from "./services/sse.service.js";

const app = express();
const PORT = process.env.PORT || 5000;
const isDev = process.env.NODE_ENV !== "production";

// ─── Security ─────────────────────────────────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false, crossOriginEmbedderPolicy: false }));
app.use(cors({ origin: "*", credentials: true }));

// ─── Rate limiting ────────────────────────────────────────────────────────────
// Completely disabled in development, very generous in production
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 999999 : 500,
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => isDev || req.path.includes("/sse/stream"),
  message: { error: "Too many requests, please try again later." },
});
app.use(limiter);

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api", routes);

// ─── Health ───────────────────────────────────────────────────────────────────
app.get("/", (req, res) => res.json({ status: "ok", service: "The Public Post API", env: isDev ? "dev" : "prod" }));
app.get("/health", (req, res) => res.json({ status: "ok", timestamp: new Date().toISOString() }));

// ─── 404 ─────────────────────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: "Route not found" }));

// ─── Error handler ────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || "Internal server error" });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server on http://localhost:${PORT} [${isDev ? "DEV — rate limit OFF" : "PROD"}]`);
});

async function connectDB() {
  try {
    await prisma.$connect();
    console.log("✅ Database connected");
    await startSSESubscriber();
    console.log("✅ SSE subscriber started");
  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
}
connectDB();

process.on("SIGINT", async () => { await prisma.$disconnect(); process.exit(0); });
process.on("SIGTERM", async () => { await prisma.$disconnect(); process.exit(0); });
