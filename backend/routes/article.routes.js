import express from "express";
import multer from "multer";
import { authenticate } from "../middleware/auth.middleware.js";
import { authorizeHouse } from "../middleware/house.middleware.js";
import * as controller from "../controllers/article.controller.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// ─── Public routes ─────────────────────────────────────────────────────────
// IMPORTANT: specific paths must come BEFORE /:articleId wildcard
router.get("/latest", controller.getLatestArticles);
router.get("/search", controller.searchArticles);
router.get("/journalist/:journalistId", controller.getJournalistArticles);

// ─── Journalist-only routes ─────────────────────────────────────────────────
// dashboard/me must come BEFORE /:articleId too
router.get(
  "/dashboard/me",
  authenticate,
  authorizeHouse("JOURNALIST"),
  controller.getMyDashboardArticles
);

// ─── Wildcard param route LAST ──────────────────────────────────────────────
router.get("/:articleId", controller.getArticleById);

// ─── Journalist write routes ────────────────────────────────────────────────
router.post(
  "/",
  authenticate,
  authorizeHouse("JOURNALIST"),
  upload.array("media"),
  controller.createArticle
);

router.patch(
  "/:articleId",
  authenticate,
  authorizeHouse("JOURNALIST"),
  upload.array("media"),
  controller.updateDraftArticle
);

router.post(
  "/:articleId/submit",
  authenticate,
  authorizeHouse("JOURNALIST"),
  controller.submitDraftArticle
);

export default router;
