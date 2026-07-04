import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  getUnverifiedArticles,
  submitFactCheck,
  getArticleFactChecks,
} from "../controllers/factcheck.controller.js";

const router = Router();

// Only FACT_CHECKER or ADMIN can access these
router.get(
  "/unverified",
  authenticate,
  authorize("FACT_CHECKER", "ADMIN"),
  getUnverifiedArticles
);

router.post(
  "/article/:articleId",
  authenticate,
  authorize("FACT_CHECKER", "ADMIN"),
  submitFactCheck
);

router.get("/article/:articleId", authenticate, getArticleFactChecks);

export default router;
