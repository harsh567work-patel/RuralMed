/**
 * Global error handling middleware for RuralMed API
 */

import { errorResponse } from '../utils/helpers.js';
import { logError } from '../utils/logger.js';

/**
 * Global error handler middleware
 * Should be added LAST in middleware chain
 */
export function globalErrorHandler(err, req, res, next) {
  // Log error with full context
  logError('Unhandled error', err, {
    method: req.method,
    path: req.path,
    userId: req.userId || 'anonymous',
  });

  // Handle validation errors
  if (err.statusCode === 400) {
    return res.status(400).json(errorResponse(err.message, err.errors));
  }

  // Handle authentication errors
  if (err.statusCode === 401) {
    return res.status(401).json(errorResponse(err.message));
  }

  // Handle authorization errors
  if (err.statusCode === 403) {
    return res.status(403).json(errorResponse('Access denied'));
  }

  // Handle not found errors
  if (err.statusCode === 404) {
    return res.status(404).json(errorResponse(err.message));
  }

  // Handle constraint violations (database errors)
  if (err.message && err.message.includes('UNIQUE constraint failed')) {
    const field = err.message.split('.')[1]?.split(' ')[0] || 'entry';
    return res.status(409).json(errorResponse(`${field} already exists`));
  }

  if (err.message && err.message.includes('FOREIGN KEY constraint failed')) {
    return res.status(400).json(errorResponse('Invalid reference to related data'));
  }

  // Handle generic database errors
  if (err.message && err.message.includes('database')) {
    const isDev = process.env.NODE_ENV === 'development';
    return res.status(500).json(
      errorResponse(isDev ? err.message : 'Database error occurred')
    );
  }

  // Default 500 error
  const isDev = process.env.NODE_ENV === 'development';
  return res.status(500).json(
    errorResponse(isDev ? err.message : 'Internal server error')
  );
}

/**
 * Async error wrapper for route handlers
 * Wraps async functions to catch errors and pass to error handler
 */
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
