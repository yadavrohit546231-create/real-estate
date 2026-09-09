import fs from 'fs';
import path from 'path';
import { ENV } from '../config/env';

export interface UploadedFileResult {
  url: string;
  thumbnailUrl?: string;
  fileName: string;
  size: number;
}

export interface StorageProvider {
  upload(file: Express.Multer.File): Promise<UploadedFileResult>;
  delete(fileUrl: string): Promise<boolean>;
}

export class LocalStorageProvider implements StorageProvider {
  private uploadDir: string;

  constructor() {
    this.uploadDir = path.resolve(process.cwd(), ENV.UPLOAD_DIR);
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async upload(file: Express.Multer.File): Promise<UploadedFileResult> {
    let ext = path.extname(file.originalname || '').toLowerCase();
    if (!ext || ext === '.') {
      if (file.mimetype === 'image/png') ext = '.png';
      else if (file.mimetype === 'image/webp') ext = '.webp';
      else if (file.mimetype === 'image/gif') ext = '.gif';
      else if (file.mimetype === 'image/heic') ext = '.heic';
      else if (file.mimetype === 'application/pdf') ext = '.pdf';
      else ext = '.jpg';
    }
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const destination = path.join(this.uploadDir, uniqueName);

    await fs.promises.writeFile(destination, file.buffer);

    // Provide reachable local URL
    const url = `/uploads/${uniqueName}`;
    return {
      url,
      thumbnailUrl: url,
      fileName: uniqueName,
      size: file.size,
    };
  }

  async delete(fileUrl: string): Promise<boolean> {
    try {
      const fileName = path.basename(fileUrl);
      const filePath = path.join(this.uploadDir, fileName);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export function getStorageProvider(): StorageProvider {
  return new LocalStorageProvider();
}
