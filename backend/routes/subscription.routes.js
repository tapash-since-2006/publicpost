import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  subscribe,
  unsubscribe,
  getMySubscriptions,
  getMySubscribers,
  getFeed,
} from "../controllers/subscription.controller.js";

const router = Router();

router.use(authenticate);

// ─── Specific paths BEFORE /:journalistId wildcard ──────────────────────────
router.get("/", getMySubscriptions);
router.get("/my/subscribers", getMySubscribers);
router.get("/my/feed", getFeed);

// ─── Wildcard param routes LAST ─────────────────────────────────────────────
router.post("/:journalistId", subscribe);
router.delete("/:journalistId", unsubscribe);

export default router;
