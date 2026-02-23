import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import routes from './routes/index.js';
import { errorHandler } from './middleware/error.js';
import { logger } from './utils/logger.js';
import { config } from './utils/config.js';

const app = express();

// Security Hardening
app.use(helmet());
app.use(cors());

// Performance Optimization
app.use(compression());
app.use(express.json());

// Rate Limiting (limit each IP to 100 requests per 15 mins)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: config.nodeEnv === 'production' ? 100 : 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Health Check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', environment: config.nodeEnv, timestamp: new Date().toISOString() });
});

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info(`${req.method} ${req.url} ${res.statusCode} - ${duration}ms`, {
      method: req.method,
      url: req.url,
      statusCode: res.statusCode,
      durationMs: duration,
      transactionId: req.body?.transactionId || req.params?.transactionId || req.headers['x-transaction-id']
    });
  });
  next();
});

// Routes
app.use(routes);

// Error Handling
app.use(errorHandler);

export default app;
