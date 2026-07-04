import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { getSideBySide } from "../controllers/comparison.controller.js";

const router = Router();

router.get("/:articleId", authenticate, getSideBySide);

export default router;
