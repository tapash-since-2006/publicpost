import { Router } from "express";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import { streamNotifications, getSSEStatus } from "../controllers/sse.controller.js";

const router = Router();

// Client subscribes to their own real-time notification stream
router.get("/stream", authenticate, streamNotifications);

// Admin: how many active SSE connections
router.get("/status", authenticate, authorize("ADMIN"), getSSEStatus);

export default router;
