import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  flagArticle,
  getArticleFlags,
  getFlaggedArticles,
  takeDownArticle,
  restoreArticle,
  warnJournalist,
  getModerationLog,
} from "../controllers/moderation.controller.js";

const router = Router();

// Any logged-in user can flag
router.post("/flag/:articleId", authenticate, flagArticle);
router.get("/flags/:articleId", authenticate, getArticleFlags);

// Admin only
router.get("/flagged", authenticate, authorize("ADMIN"), getFlaggedArticles);
router.patch("/takedown/:articleId", authenticate, authorize("ADMIN"), takeDownArticle);
router.patch("/restore/:articleId", authenticate, authorize("ADMIN"), restoreArticle);
router.post("/warn/:journalistId", authenticate, authorize("ADMIN"), warnJournalist);
router.get("/log", authenticate, authorize("ADMIN"), getModerationLog);

export default router;
