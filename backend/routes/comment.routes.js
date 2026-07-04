import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware.js";
import { addComment, getComments, deleteComment } from "../controllers/comment.controller.js";

const router = Router();

// specific path before wildcard
router.delete("/comment/:commentId", authenticate, deleteComment);

router.get("/:articleId", getComments);
router.post("/:articleId", authenticate, addComment);

export default router;
