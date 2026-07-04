import express from "express";
import { register, login, logout, getProfile } from "../controllers/auth.controller.js";
import { completeRegistrationController } from "../controllers/completeRegistration.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);
router.post("/complete-registration", completeRegistrationController);
router.post("/logout", authenticate, logout);
router.get("/me", authenticate, getProfile);

export default router;
