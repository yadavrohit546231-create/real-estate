import * as dotenv from 'dotenv';
import * as path from 'path';

// Load root or local .env
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });
dotenv.config();

function getDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL;
  }
  const user = encodeURIComponent(process.env.DATABASE_USER || process.env.DATABSE_USER || process.env.DB_USER || 'root');
  const password = encodeURIComponent(process.env.DATABASE_PASSWORD || process.env.DATABSE_PASSWORD || process.env.DB_PASSWORD || '');
  const host = process.env.DATABASE_HOST || process.env.DATABSE_HOST || process.env.DB_HOST || 'localhost';
  const port = process.env.DATABASE_PORT || process.env.DATABSE_PORT || process.env.DB_PORT || '3306';
  const name = process.env.DATABASE_NAME || process.env.DATABSE_NAME || process.env.DB_NAME || 'real-estate';
  return `mysql://${user}:${password}@${host}:${port}/${name}`;
}

const resolvedDbUrl = getDatabaseUrl();
process.env.DATABASE_URL = resolvedDbUrl;

export const ENV = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: resolvedDbUrl,
  JWT_ACCESS_SECRET: process.env.JWT_ACCESS_SECRET || 'fallback-access-secret-32-chars-long-estate',
  JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret-32-chars-long-estate',
  ACCESS_TOKEN_EXPIRES_IN: process.env.ACCESS_TOKEN_EXPIRES_IN || '15m',
  REFRESH_TOKEN_EXPIRES_IN: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',
  CORS_ORIGIN: process.env.CORS_ORIGIN ? process.env.CORS_ORIGIN.split(',') : ['http://localhost:5173', 'http://localhost:3000'],
  STORAGE_PROVIDER: process.env.STORAGE_PROVIDER || 'local',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  MOCK_PAYMENTS_ENABLED: process.env.MOCK_PAYMENTS_ENABLED !== 'false',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};
