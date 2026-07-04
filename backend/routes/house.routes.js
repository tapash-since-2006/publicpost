import express from "express";
import { selectHouseController } from "../controllers/house.controller.js";
import { authenticate } from "../middleware/auth.middleware.js";

const router = express.Router();

// POST /house/select
router.post("/select", authenticate, selectHouseController);

export default router;
