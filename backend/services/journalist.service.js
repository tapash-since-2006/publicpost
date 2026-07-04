import prisma from "../prisma/client.js";
import { uploadToCloudinary } from "../utils/uploadToCloudinary.js";

const VALID_DOC_TYPES = ["PRESS_ID", "GOVERNMENT_ID", "EMPLOYMENT_LETTER", "PORTFOLIO", "OTHER"];

// ─── Apply as journalist (no files - profile creation only) ───────────────────
export const applyAsJournalistService = async (userId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new Error("User not found");

  const existingProfile = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (existingProfile) throw new Error("Journalist application already submitted");

  const journalistProfile = await prisma.journalistProfile.create({
    data: { userId, verified: false, credibilityScore: 0 },
  });

  return journalistProfile;
};

// ─── Save documents uploaded directly from browser to Cloudinary ─────────────
// Frontend uploads to Cloudinary, gets back {url, publicId}, sends those here
export const saveDocumentUrlsService = async (userId, documents) => {
  const profile = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("No journalist profile found. Please apply first.");

  if (!Array.isArray(documents) || documents.length === 0) {
    throw new Error("At least one document is required");
  }
  if (documents.length > 5) throw new Error("Maximum 5 documents allowed");

  for (const doc of documents) {
    if (!doc.url) throw new Error("Each document must have a url");
    if (!VALID_DOC_TYPES.includes(doc.type)) {
      throw new Error(`Invalid document type: ${doc.type}. Valid: ${VALID_DOC_TYPES.join(", ")}`);
    }
  }

  await prisma.journalistDocument.createMany({
    data: documents.map(doc => ({
      journalistId: profile.id,
      type: doc.type,
      url: doc.url,
      publicId: doc.publicId || doc.url,
      status: "PENDING",
    })),
  });

  return { saved: documents.length };
};

// ─── Upload via backend (fallback - may timeout on some systems) ──────────────
export const uploadDocumentsBackendService = async (userId, files, docTypes) => {
  const profile = await prisma.journalistProfile.findUnique({ where: { userId } });
  if (!profile) throw new Error("No journalist profile found. Please apply first.");

  const types = Array.isArray(docTypes) ? docTypes : [docTypes];
  if (files.length !== types.length) {
    throw new Error(`Each file needs a docType. Got ${files.length} files but ${types.length} types`);
  }
  for (const t of types) {
    if (!VALID_DOC_TYPES.includes(t)) {
      throw new Error(`Invalid document type: ${t}. Valid: ${VALID_DOC_TYPES.join(", ")}`);
    }
  }

  const uploaded = [];
  for (let i = 0; i < files.length; i++) {
    try {
      const result = await uploadToCloudinary(files[i], "journalist_documents");
      uploaded.push({ type: types[i], url: result.secure_url, publicId: result.public_id });
    } catch (err) {
      throw new Error(`Failed to upload document ${i + 1}: ${err.message}`);
    }
  }

  await prisma.journalistDocument.createMany({
    data: uploaded.map(doc => ({ journalistId: profile.id, ...doc })),
  });

  return { uploaded: uploaded.length };
};

// ─── Get journalist documents (admin view) ────────────────────────────────────
export const getJournalistDocumentsService = async (journalistId) => {
  return await prisma.journalistDocument.findMany({
    where: { journalistId },
    orderBy: { createdAt: "asc" },
  });
};

// ─── Review a document ────────────────────────────────────────────────────────
export const reviewDocumentService = async (documentId, status, adminNote) => {
  if (!["APPROVED", "REJECTED"].includes(status)) {
    throw new Error("Status must be APPROVED or REJECTED");
  }
  return await prisma.journalistDocument.update({
    where: { id: documentId },
    data: { status, adminNote: adminNote ?? null },
  });
};

// ─── Get journalist profile by profileId (public) ─────────────────────────────
export const getJournalistProfileService = async (journalistId) => {
  const profile = await prisma.journalistProfile.findUnique({
    where: { id: journalistId },
    include: {
      user: { select: { id: true, name: true, politicalLeaning: true, createdAt: true } },
      articles: {
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { tags: true, media: true },
      },
    },
  });
  if (!profile) throw new Error("Journalist not found");
  return profile;
};

// ─── Get my journalist profile ────────────────────────────────────────────────
export const getMyJournalistProfileService = async (userId) => {
  const profile = await prisma.journalistProfile.findUnique({
    where: { userId },
    include: {
      user: { select: { id: true, name: true, politicalLeaning: true } },
      documents: true,
    },
  });
  if (!profile) throw new Error("No journalist profile found. Please apply first.");
  return profile;
};
