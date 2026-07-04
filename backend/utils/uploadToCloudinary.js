import { v2 as cloudinary } from "cloudinary";
import { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } from "../config/env.js";

// Explicitly configure here — don't rely on config/cloudinary.js being imported first
cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME,
  api_key: CLOUDINARY_API_KEY,
  api_secret: CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = (file, folder) => {
  return new Promise((resolve, reject) => {
    // Validate cloudinary config before attempting upload
    if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
      return reject(new Error("Cloudinary credentials not configured in .env"));
    }

    if (!file || !file.buffer) {
      return reject(new Error("Invalid file — no buffer found"));
    }

    // Determine resource type based on mimetype
    let resourceType = "image";
    if (
      file.mimetype === "application/pdf" ||
      file.mimetype === "application/msword" ||
      file.mimetype === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      resourceType = "raw"; // Cloudinary uses "raw" for PDFs and docs
    } else if (file.mimetype?.startsWith("video/")) {
      resourceType = "video";
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        timeout: 60000, // 60 second timeout
      },
      (error, result) => {
        if (error) return reject(new Error(`Cloudinary upload failed: ${error.message}`));
        resolve(result);
      }
    );

    uploadStream.end(file.buffer);
  });
};
