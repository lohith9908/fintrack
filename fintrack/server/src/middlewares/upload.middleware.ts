import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { Request, Response, NextFunction } from "express";
import { BadRequestError } from "../utils/apiError";

// Ensure receipts directory exists
const UPLOAD_DIR = path.resolve(process.cwd(), "uploads", "receipts");
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

export const RECEIPT_UPLOAD_DIR = UPLOAD_DIR;

// Allowed MIME types per IMPLEMENTATION.md
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "application/pdf",
]);

// Allowed extensions
const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".pdf"]);

// 5 MB max file size
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString("hex")}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_MIME_TYPES.has(file.mimetype) || !ALLOWED_EXTENSIONS.has(ext)) {
    return cb(
      new BadRequestError(
        `Invalid file type. Allowed formats: JPG, PNG, WEBP, PDF.`
      )
    );
  }
  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

/**
 * Middleware for single receipt upload with user-friendly error handling
 */
export const receiptUpload = (fieldName = "receipt") => {
  const multerHandler = upload.single(fieldName);

  return (req: Request, res: Response, next: NextFunction) => {
    multerHandler(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          if (err.code === "LIMIT_FILE_SIZE") {
            return next(
              new BadRequestError(
                `File too large. Maximum allowed receipt size is 5 MB.`
              )
            );
          }
          return next(new BadRequestError(`Upload error: ${err.message}`));
        }
        return next(err);
      }
      next();
    });
  };
};
