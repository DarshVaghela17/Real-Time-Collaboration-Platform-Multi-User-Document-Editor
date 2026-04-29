import { Request, Response, NextFunction } from 'express';
import { config } from '../config/environment';
import { ValidationError } from '../utils/validation';

/**
 * Custom AppError class for consistent error handling
 */
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Global error handling middleware
 * Catches validation errors, JWT errors, and generic server errors
 * Returns consistent JSON response with success and message
 */
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error response
  let statusCode = 500;
  let message = 'Internal server error';
  let details = undefined;

  // Log error for debugging
  console.error('Error:', {
    name: err.name,
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  }
  // Handle ValidationError
  else if (err instanceof ValidationError) {
    statusCode = 400;
    message = err.message;
  }
  // Handle MongoDB validation errors
  else if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation error';
    details = Object.values(err.errors).map((e: any) => e.message);
  }
  // Handle MongoDB cast errors (invalid ObjectId)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: ${err.value}`;
  }
  // Handle MongoDB duplicate key error
  else if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue)[0];
    message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
  }
  // Handle JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token. Please login again.';
  }
  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token has expired. Please login again.';
  }
  // Handle Mongoose cast errors with specific message
  else if (err.message && err.message.includes('expired')) {
    statusCode = 401;
    message = err.message || 'Authentication failed';
  }
  // Handle generic errors with status code
  else if (err.statusCode) {
    statusCode = err.statusCode;
    message = err.message;
  }
  // Handle standard Error
  else if (err instanceof Error) {
    statusCode = 500;
    message = err.message || 'Internal server error';
  }

  // Build response
  const response: any = {
    success: false,
    message,
  };

  // Add error details in development mode
  if (config.env === 'development' && details) {
    response.details = details;
  }

  // Send error response
  res.status(statusCode).json(response);
};

/**
 * Async error wrapper to catch unhandled promise rejections in route handlers
 * Usage: router.post('/path', asyncHandler(controller.method))
 */
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Not Found middleware (404 errors)
 * Should be placed AFTER all route definitions
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    404,
    `Route ${req.method} ${req.path} not found`
  );
  next(error);
};
