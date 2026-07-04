import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import {
  sendTip,
  getArticleTips,
  getMyEarnings,
} from "../controllers/reward.controller.js";

const router = Router();

router.post("/tip/:articleId", authenticate, sendTip);
router.get("/tips/:articleId", authenticate, getArticleTips);
router.get("/earnings", authenticate, authorize("JOURNALIST", "ADMIN"), getMyEarnings);

export default router;
