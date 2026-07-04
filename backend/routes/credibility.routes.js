import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getCredibility,
  getCredibilityHistory,
  getLeaderboard,
} from "../controllers/credibility.controller.js";

const router = Router();

// specific routes before wildcards
router.get("/leaderboard", getLeaderboard);
router.get("/:journalistId/history", authenticate, getCredibilityHistory);
router.get("/:journalistId", authenticate, getCredibility);

export default router;
