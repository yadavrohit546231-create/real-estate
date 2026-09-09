import { Router, Response } from 'express';
import multer from 'multer';
import { getStorageProvider } from '../../storage/storage.provider';
import { authenticateToken } from '../../middleware/auth';
import { sendSuccess, sendError } from '../../utils/response';

const router = Router();
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only image files and PDFs are allowed'));
    }
  },
});

const storageProvider = getStorageProvider();

router.post(
  '/',
  authenticateToken,
  upload.single('file'),
  async (req: any, res: Response) => {
    try {
      if (!req.file) {
        return sendError(res, 'No file was provided for upload', 400);
      }
      const result = await storageProvider.upload(req.file);
      return sendSuccess(res, result, 'File uploaded successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'File upload failed', 400);
    }
  }
);

export default router;
