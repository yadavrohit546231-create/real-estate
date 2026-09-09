import { app } from './app';
import { ENV } from './config/env';

const server = app.listen(ENV.PORT, () => {
  console.log(`🚀 Real Estate API server running at http://localhost:${ENV.PORT}/api`);
  console.log(`📖 Interactive API Documentation available at http://localhost:${ENV.PORT}/api/docs`);
  console.log(`🩺 Health check endpoint: http://localhost:${ENV.PORT}/api/health`);
});

// Handle graceful termination
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
  });
});
