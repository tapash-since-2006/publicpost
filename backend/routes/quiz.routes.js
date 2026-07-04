import express from "express";
import { submitQuizController, getQuizQuestionsController } from "../controllers/quiz.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/questions", getQuizQuestionsController); // public - used by frontend
router.post("/submit", authenticate, submitQuizController);
router.post("/retake", authenticate, submitQuizController);

export default router;
