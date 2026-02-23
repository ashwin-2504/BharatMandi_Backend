import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const statusCode = err.status || err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  logger.error(`Error processing request ${req.method} ${req.url}`, err, {
    statusCode,
    path: req.path,
    requestId: req.headers['x-request-id']
  });

  res.status(statusCode).json({
    success: false,
    code,
    message
  });
};
