import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import {
  getNotifications,
  markRead,
  markAllRead,
  deleteNotification,
} from "../controllers/notification.controller.js";

const router = Router();

router.use(authenticate);

router.get("/", getNotifications);
router.patch("/read", markRead);
router.patch("/read-all", markAllRead);
router.delete("/:id", deleteNotification);

export default router;
