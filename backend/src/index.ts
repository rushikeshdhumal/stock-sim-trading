import express, { Application } from 'express';
import cors from 'cors';
import { env } from './config/env';
import logger from './config/logger';
import { getPrismaClient, disconnectDatabase } from './config/database';
import { getRedisClient, disconnectRedis } from './config/redis';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';
import routes from './routes';

const app: Application = express();
const PORT = parseInt(env.PORT);

// Middleware
app.use(cors({
  origin: env.FRONTEND_URL,
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// Rate limiting
app.use('/api', apiLimiter);

// API routes
app.use('/api', routes);

// Root route
app.get('/', (_req, res) => {
  res.json({
    name: 'Stock Simulation Trading Game API',
    version: '1.0.0',
    status: 'running',
    docs: '/api/health',
  });
});

// Error handlers (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Start server
const startServer = async () => {
  try {
    // Initialize database connection
    getPrismaClient();
    logger.info('✓ Database connected');

    // Initialize Redis connection
    getRedisClient();
    logger.info('✓ Redis connected');

    // Start listening
    app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📡 API available at http://localhost:${PORT}/api`);
      logger.info(`🌍 Environment: ${env.NODE_ENV}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('Shutting down gracefully...');

  try {
    await disconnectDatabase();
    await disconnectRedis();
    logger.info('✓ All connections closed');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown:', error);
    process.exit(1);
  }
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

// Start the server
startServer();

export default app;
