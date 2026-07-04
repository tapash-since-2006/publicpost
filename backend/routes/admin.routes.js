import express from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import * as controller from "../controllers/admin.controller.js";

const router = express.Router();

router.use(authenticate, authorize("ADMIN"));

router.get("/stats", controller.getPlatformStats);

router.get("/journalists/pending", controller.getPendingJournalists);
router.patch("/journalists/:journalistId/approve", controller.approveJournalist);
router.delete("/journalists/:journalistId/reject", controller.rejectJournalist);

router.get("/articles/pending", controller.getPendingArticles);
router.patch("/articles/:articleId/approve", controller.approveArticle);
router.patch("/articles/:articleId/reject", controller.rejectArticle);
router.patch("/articles/:articleId/correct", controller.requestCorrection);

// Quiz question management
router.get("/quiz-questions", controller.getQuizQuestions);
router.put("/quiz-questions", controller.updateQuizQuestions);

export default router;
