import cloudinary from "../config/cloudinary.js";
import {
  applyAsJournalistService,
  saveDocumentUrlsService,
  uploadDocumentsBackendService,
  getJournalistDocumentsService,
  reviewDocumentService,
  getJournalistProfileService,
  getMyJournalistProfileService,
} from "../services/journalist.service.js";

// GET /api/journalist/cloudinary-signature
// Generates a signed upload so the browser can upload directly to Cloudinary
export const getCloudinarySignature = (req, res) => {
  try {
    if (!process.env.CLOUDINARY_API_SECRET || !process.env.CLOUDINARY_CLOUD_NAME) {
      return res.status(500).json({ error: "Cloudinary not configured on server" });
    }
    const timestamp = Math.round(new Date().getTime() / 1000);
    const folder = "journalist_documents";
    const signature = cloudinary.utils.api_sign_request(
      { timestamp, folder },
      process.env.CLOUDINARY_API_SECRET
    );
    res.status(200).json({
      signature,
      timestamp,
      folder,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to generate upload signature" });
  }
};

// POST /api/journalist/apply
export const applyAsJournalist = async (req, res) => {
  try {
    const journalist = await applyAsJournalistService(req.user.userId);
    res.status(201).json({
      message: "Application submitted. Upload supporting documents to improve approval chances.",
      journalist,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Application failed" });
  }
};

// POST /api/journalist/documents/save-urls
export const saveDocumentUrls = async (req, res) => {
  try {
    const { documents } = req.body;
    const result = await saveDocumentUrlsService(req.user.userId, documents);
    res.status(201).json({
      message: `${result.saved} document(s) saved successfully`,
      ...result,
    });
  } catch (error) {
    res.status(400).json({ error: error.message || "Failed to save documents" });
  }
};

// POST /api/journalist/documents/upload (backend proxy fallback)
export const uploadDocuments = async (req, res) => {
  try {
    const files = req.files || [];
    if (files.length === 0) return res.status(400).json({ error: "No files provided" });
    let docTypes = req.body["docTypes[]"] || req.body.docTypes || [];
    if (!Array.isArray(docTypes)) docTypes = [docTypes];
    const result = await uploadDocumentsBackendService(req.user.userId, files, docTypes);
    res.status(201).json({ message: `${result.uploaded} document(s) uploaded` });
  } catch (error) {
    res.status(400).json({ error: error.message || "Upload failed" });
  }
};

export const getJournalistDocuments = async (req, res) => {
  try {
    const docs = await getJournalistDocumentsService(req.params.journalistId);
    res.status(200).json(docs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const reviewDocument = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const doc = await reviewDocumentService(req.params.documentId, status, adminNote);
    res.status(200).json({ message: "Document reviewed", document: doc });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getJournalistProfile = async (req, res) => {
  try {
    const profile = await getJournalistProfileService(req.params.journalistId);
    res.status(200).json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};

export const getMyJournalistProfile = async (req, res) => {
  try {
    const profile = await getMyJournalistProfileService(req.user.userId);
    res.status(200).json(profile);
  } catch (err) {
    res.status(404).json({ error: err.message });
  }
};
