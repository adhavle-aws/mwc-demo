import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../types';

/**
 * Custom error class for API errors
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error handling middleware
 */
export function errorHandler(
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  // Handle custom AppError
  if (err instanceof AppError) {
    const errorResponse: ApiError = {
      error: err.name,
      message: err.message,
      details: err.details,
    };
    res.status(err.statusCode).json(errorResponse);
    return;
  }

  // Handle AWS SDK errors
  if (err.name && err.name.includes('ServiceException')) {
    const errorResponse: ApiError = {
      error: 'AWSError',
      message: err.message,
      details: { name: err.name },
    };
    res.status(500).json(errorResponse);
    return;
  }

  // Handle generic errors
  const errorResponse: ApiError = {
    error: 'InternalServerError',
    message: 'An unexpected error occurred',
    details:
      process.env.NODE_ENV === 'development'
        ? { message: err.message, stack: err.stack }
        : undefined,
  };
  res.status(500).json(errorResponse);
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
