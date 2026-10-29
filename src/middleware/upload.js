import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';

export const IMAGE_ERROR = 'The image must be a JPG, PNG or WEBP file, max 2 MB.';

const EXTENSIONS = { 'image/jpeg': '.jpg', 'image/png': '.png', 'image/webp': '.webp' };
const MAX_BYTES = 2 * 1024 * 1024;

/**
 * Parses the multipart product form and saves the optional `image` file under a
 * random name. A rejected file never stops the request: it sets req.imageError
 * so the controller can show it next to the other field errors.
 */
export function createProductImageUpload(uploadsDir) {
  const upload = multer({
    storage: multer.diskStorage({
      destination: uploadsDir,
      filename: (req, file, cb) => cb(null, `${crypto.randomUUID()}${EXTENSIONS[file.mimetype]}`),
    }),
    limits: { fileSize: MAX_BYTES, files: 1, fields: 30 },
    fileFilter: (req, file, cb) => {
      // An empty file input still sends a part with no filename.
      if (!file.originalname) return cb(null, false);
      if (!EXTENSIONS[file.mimetype]) {
        req.imageError = IMAGE_ERROR;
        return cb(null, false);
      }
      cb(null, true);
    },
  }).single('image');

  return (req, res, next) => {
    upload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        req.imageError = IMAGE_ERROR;
        return next();
      }
      next(err);
    });
  };
}

// Only ever deletes files inside uploadsDir that the app created.
export function removeUploadedImage(uploadsDir, imagePath) {
  if (!imagePath?.startsWith('/uploads/')) return;
  const file = path.join(uploadsDir, path.basename(imagePath));
  fs.rm(file, { force: true }, () => {});
}
