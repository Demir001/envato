import { Request, Response, NextFunction } from 'express';

/**
 * Custom Error class for API errors.
 */
export class ApiError extends Error {
  public statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ApiError.prototype);
  }
}

/**
 * 404 Not Found Handler
 * This middleware catches requests that don't match any route.
 */
export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  const error = new ApiError(404, `Not Found - ${req.originalUrl}`);
  next(error);
};

/**
 * Global Error Handler
 * This middleware catches all errors passed via next(error).
 * It must be the last middleware in the stack.
 */
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
) => {
  let statusCode: number;
  let message: string;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
  } else if (err.name === 'SyntaxError') {
    // Handle invalid JSON body
    statusCode = 400;
    message = 'Invalid JSON payload received.';
  } else if (err.name === 'UnauthorizedError') {
    // Handle errors from express-jwt (if used)
    statusCode = 401;
    message = 'Invalid token.';
  } else {
    // Default to 500 Internal Server Error
    statusCode = 500;
    message = 'An unexpected error occurred on the server.';
  }

  // Log the error in development for debugging
  // In production, you'd use a dedicated logger (like Winston or Sentry)
  if (process.env.NODE_ENV !== 'production') {
    console.error('--- ERROR STACK ---');
    console.error(err);
    console.error('-------------------');
  }

  // Send the standardized error response
  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack,
  });
};