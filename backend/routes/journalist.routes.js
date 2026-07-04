import express from "express";
import {
  applyAsJournalist,
  saveDocumentUrls,
  uploadDocuments,
  getCloudinarySignature,
  getJournalistDocuments,
  reviewDocument,
  getJournalistProfile,
  getMyJournalistProfile,
} from "../controllers/journalist.controller.js";
import { authenticate, authorize } from "../middleware/auth.middleware.js";
import upload from "../middleware/upload.middleware.js";

const router = express.Router();

// Public
router.get("/profile/:journalistId", getJournalistProfile);

// Authenticated
router.get("/my/profile", authenticate, getMyJournalistProfile);
router.get("/cloudinary-signature", authenticate, getCloudinarySignature);

// Apply
router.post("/apply", authenticate, applyAsJournalist);

// Document upload methods
router.post("/documents/save-urls", authenticate, saveDocumentUrls);
router.post("/documents/upload", authenticate, upload.array("documents", 5), uploadDocuments);

// Admin
router.get("/:journalistId/documents", authenticate, authorize("ADMIN"), getJournalistDocuments);
router.patch("/documents/:documentId/review", authenticate, authorize("ADMIN"), reviewDocument);

export default router;
