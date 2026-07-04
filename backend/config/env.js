import dotenv from "dotenv";
dotenv.config();

export const PORT = process.env.PORT || 8012;
export const JWT_SECRET = process.env.JWT_SECRET || "changeme";
export const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
export const DATABASE_URL = process.env.DATABASE_URL;
export const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
export const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
export const CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME;
export const CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY;
export const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET;
