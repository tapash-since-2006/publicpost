import express from "express";
import authRoutes from "./auth.routes.js";
import articleRoutes from "./article.routes.js";
import journalistRoutes from "./journalist.routes.js";
import adminRoutes from "./admin.routes.js";
import quizRoutes from "./quiz.routes.js";
import houseRoutes from "./house.routes.js";
import notificationRoutes from "./notification.routes.js";
import credibilityRoutes from "./credibility.routes.js";
import factCheckRoutes from "./factcheck.routes.js";
import rewardRoutes from "./reward.routes.js";
import subscriptionRoutes from "./subscription.routes.js";
import moderationRoutes from "./moderation.routes.js";
import comparisonRoutes from "./comparison.routes.js";
import commentRoutes from "./comment.routes.js";
import sseRoutes from "./sse.routes.js";
import analyticsRoutes from "./analytics.routes.js";

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/articles", articleRoutes);
router.use("/journalist", journalistRoutes);
router.use("/admin", adminRoutes);
router.use("/quiz", quizRoutes);
router.use("/house", houseRoutes);
router.use("/notifications", notificationRoutes);
router.use("/credibility", credibilityRoutes);
router.use("/factcheck", factCheckRoutes);
router.use("/rewards", rewardRoutes);
router.use("/subscriptions", subscriptionRoutes);
router.use("/moderation", moderationRoutes);
router.use("/compare", comparisonRoutes);
router.use("/comments", commentRoutes);
router.use("/sse", sseRoutes);
router.use("/analytics", analyticsRoutes);

export default router;
