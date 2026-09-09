import express, { Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import swaggerUi from 'swagger-ui-express';
import routes from './routes';
import { errorHandler } from './middleware/errorHandler';
import { apiRateLimiter } from './middleware/rateLimiter';
import { swaggerDocument } from './docs/swagger';
import { ENV } from './config/env';

export const app = express();

// Security Headers
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);

// CORS
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl)
      if (!origin) return callback(null, true);
      return callback(null, true);
    },
    credentials: true,
  })
);

// Rate Limiting
app.use('/api', apiRateLimiter);

// Body Parsers
app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ extended: true, limit: '25mb' }));

// Static uploads serving
app.use('/uploads', express.static(path.resolve(process.cwd(), ENV.UPLOAD_DIR)));

// Swagger Documentation
app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// Mount Main API Router
app.use('/api', routes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API Route ${req.method} ${req.originalUrl} not found`,
  });
});

// Centralized Error Handler
app.use(errorHandler);
