import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  recordView,
  getMyAnalytics,
  getArticleAnalytics,
  getPlatformAnalytics,
} from "../controllers/analytics.controller.js";

const router = Router();

// Record a view — public but optional auth (to deduplicate logged-in users)
router.post("/view/:articleId", recordView);

// Journalist: own dashboard analytics
router.get("/me", authenticate, authorize("JOURNALIST", "ADMIN"), getMyAnalytics);

// Journalist: per-article breakdown
router.get("/article/:articleId", authenticate, authorize("JOURNALIST", "ADMIN"), getArticleAnalytics);

// Admin: platform-wide stats
router.get("/platform", authenticate, authorize("ADMIN"), getPlatformAnalytics);

export default router;
