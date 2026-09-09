import { Router, Response, NextFunction } from 'express';
import multer from 'multer';
import { getStorageProvider } from '../../storage/storage.provider';
import { authenticateToken } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 }, // 25 MB limit for high-res device camera photos
  fileFilter: (_req, file, cb) => {
    const isImageOrPdf =
      file.mimetype.startsWith('image/') ||
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/octet-stream' ||
      /\.(jpe?g|png|webp|gif|heic|heif)$/i.test(file.originalname || '');
    if (isImageOrPdf) {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  },
});

const storageProvider = getStorageProvider();

const conditionalMulter = (req: any, res: Response, next: NextFunction): void => {
  const contentType = req.headers['content-type'] || '';
  if (contentType.includes('multipart/form-data')) {
    upload.single('file')(req, res, (err) => {
      if (err) {
        sendError(res, err.message || 'File upload failed', 400);
        return;
      }
      next();
    });
    return;
  }
  next();
};

router.post(
  '/',
  authenticateToken,
  conditionalMulter,
  async (req: any, res: Response) => {
    try {
      if (req.file) {
        const result = await storageProvider.upload(req.file);
        return sendSuccess(res, result, 'File uploaded successfully', 201);
      }

      if (req.body?.base64) {
        const rawBase64 = req.body.base64;
        const cleaned = rawBase64.replace(/^data:image\/\w+;base64,/, '');
        const buffer = Buffer.from(cleaned, 'base64');
        const originalname = req.body.fileName || `photo_${Date.now()}.jpg`;
        const mimetype = req.body.mimeType || 'image/jpeg';

        const result = await storageProvider.upload({
          buffer,
          originalname,
          mimetype,
          size: buffer.length,
        } as any);
        return sendSuccess(res, result, 'File uploaded successfully', 201);
      }

      return sendError(res, 'No file or image data was provided for upload', 400);
    } catch (err: any) {
      return sendError(res, err.message || 'File upload failed', 400);
    }
  }
);

export default router;
